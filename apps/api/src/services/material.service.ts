import { ListMaterialDto } from '@/dtos/material.dto';
import HttpException from '@exceptions/HttpException';
import { Language, linksMail } from '@utils/mail-texts';
import config from 'config';
import { createClient, WebDAVClient } from "webdav";

import MailService from './mail.service';

const MATERIAL_DIR = "/altklausuren";
const SHARE_DAYS = 7;

export interface MaterialInfo extends ListMaterialDto {
    updated?: string;
}

interface OcsShareResponse {
    ocs?: {
        meta?: { status?: string };
        data?: { file_target: string, url: string };
    };
}

class MaterialService {

    private createWebDavClient(): WebDAVClient {
        return createClient(config.get('accHost'), {
            username: config.get('accUsername'),
            password: config.get('accPassword')
        });
    }

    public async getMaterials(): Promise<MaterialInfo[]> {
        const client = this.createWebDavClient();

        const files = (await client.getDirectoryContents(MATERIAL_DIR)) as {basename: string, type: string, etag: string, lastmod: string}[];

        return files.filter(f => f.type === 'directory').map(file => {
            // Nextcloud propagates changes of contained files to the folder's modification time
            const updated = new Date(file.lastmod);
            return {
                name: file.basename,
                etag: file.etag.replace("&quot;", "").replace("&quot;", ""),
                updated: isNaN(updated.getTime()) ? undefined : updated.toISOString(),
            };
        });
    }

    public async createShares(modules: ListMaterialDto[], email: string, lang: Language = 'de'): Promise<void> {
        const client = this.createWebDavClient();
        const mail = new MailService();

        const files = (await client.getDirectoryContents(MATERIAL_DIR)) as {filename: string, basename: string, etag: string}[];
        const selectedFiles = files.filter(file => modules.find(f => ("&quot;"+f.etag+"&quot;") === file.etag) !== undefined);

        const urls: {name: string, url: string}[] = [];

        const expire = new Date();
        expire.setDate(expire.getDate() + SHARE_DAYS);

        for (const file of selectedFiles) {
            urls.push(await this.createPublicShare(file.filename, file.basename, expire));
        }

        let linksFormatted = "";
        urls.forEach(link => linksFormatted += link.name + " ~> " + link.url + "\n")

        const { subject, text } = linksMail(lang, linksFormatted, expire);
        await mail.mail(email, subject, text);
    }

    // Creates a public link share (shareType=3) via the OCS API of the same server as accHost
    private async createPublicShare(path: string, name: string, expire: Date): Promise<{name: string, url: string}> {
        const ocsUrl = new URL("/ocs/v1.php/apps/files_sharing/api/v1/shares", config.get<string>('accHost'));
        ocsUrl.search = new URLSearchParams({
            format: "json",
            name,
            path,
            shareType: "3",
            expireDate: expire.toISOString().slice(0, 10),
        }).toString();

        const basicLogin = Buffer.from(config.get("accUsername") + ":" + config.get("accPassword")).toString('base64');
        const response = await fetch(ocsUrl, {
            method: "POST",
            headers: {
                "Authorization": "Basic " + basicLogin,
                "OCS-APIRequest": "true",
            },
        });

        const body: OcsShareResponse | undefined = response.ok ? await response.json().catch(() => undefined) : undefined;
        const share = body?.ocs?.data;
        if (body?.ocs?.meta?.status !== "ok" || !share) {
            throw new HttpException(502, `Freigabe für "${name}" konnte nicht erstellt werden`);
        }

        return { name: share.file_target.replace("/", ""), url: share.url };
    }

}

export default MaterialService;
