import { ListMaterialDto } from '@/dtos/material.dto';
import config from 'config';
import { createClient } from "webdav";

import * as okhttp from "okhttp";
import MailService from './mail.service';

const RequestBuilder = okhttp.RequestBuilder;

class MaterialService {

    public async getMaterials(): Promise<ListMaterialDto[]> {

        const client = createClient(config.get('accHost'), {
            username: config.get('accUsername'),
            password: config.get('accPassword')
        }); 

        const files = (await client.getDirectoryContents("/altklausuren")) as {basename: string, type: string, etag: string}[];
    
        return files.filter(f => f.type === 'directory').map(file => ({ name: file.basename, etag: file.etag.replace("&quot;", "").replace("&quot;", "")} as ListMaterialDto) )
    }
    
    public async createShares(modules: ListMaterialDto[], email: string) {
        const client = createClient(config.get('accHost'), {
            username: config.get('accUsername'),
            password: config.get('accPassword')
        }); 

        const mail = new MailService();

        const files = (await client.getDirectoryContents("/altklausuren")) as {filename: string, etag: string}[];
        const filteredFiles = files.filter(file => modules.find(f => ("&quot;"+f.etag+"&quot;") === file.etag) !== undefined).map(file => file.filename);
        
        const urls: {name: string, url: string}[] = [];

        let expire = new Date();
        for(const file of filteredFiles) {
            const name = "neuertest"
            expire = new Date();
            const numberOfDaysToAdd = 7;
            expire.setDate(expire.getDate() + numberOfDaysToAdd); 

            const ownCloudUrl = "https://sync.academiccloud.de/ocs/v1.php/apps/files_sharing/api/v1/shares?format=json&name=" +
                + name + "&path=" + encodeURIComponent(file) 
                + "&shareType=3&expireDate=" + expire.toISOString().slice(0, 10);
            const basicLogin = Buffer.from(config.get("accUsername") + ":" + config.get("accPassword")).toString('base64')
            const data = await new RequestBuilder()
                .url(ownCloudUrl)
                .header('Authorization', 'Basic ' + basicLogin)
                .POST({}).buildAndExecute()
            
            const oscData = JSON.parse(data.data).ocs.data;
            const fileName = oscData.file_target.replace("/", "");
            const url = oscData.url;
            urls.push({name: fileName, url}) 
        }

        let linksFormatted = "";
        urls.forEach(link => linksFormatted += link.name + " ~> " + link.url + "\n")

        mail.mail(email, "Lernunterlagen Links", 
            "Hallo,\ndu kannst die Lernunterlagen unter folgendem/n Links downloaden: \n\n" + linksFormatted
            + "\n\nDie Links sind gültig bis: " + expire.toLocaleDateString("de-De") + ", bitte lade die Unterlagen vorher herunter!"
            + "\nSolltest du weitere Unterlagen benötigen, kannst du sie ebenfalls über den Lernmaterial-Verteiler beantragen. "
            + "\n\nViele Grüße,\ndeine Informatik Fachschaft 💻!");

    }

}

export default MaterialService;