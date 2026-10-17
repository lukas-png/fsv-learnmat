import config from 'config';
import * as okhttp from "okhttp";
import * as cheerio from 'cheerio';

const RequestBuilder = okhttp.RequestBuilder;

// Looks up a uni member in the PWA directory, intended to tell staff and students apart.
// Not wired into any route yet. Before using it for real:
// - the PWA login sends the password as a URL query parameter, which may end up in server logs
// - clarify with the university IT whether automated directory lookups are allowed
// - the signup page states that no personal data is stored; update it accordingly
class PwaService {

    cookie: String;

    public async login() {
        const data = await new RequestBuilder()
                .url(`https://pwa.uni-hildesheim.de/AuthServlet?uid=${config.get('uniUsername')}&userPassword=${encodeURIComponent(config.get('uniPassword'))}`)
                .POST({})
                .buildAndExecute();
        this.cookie = data.response.headers['set-cookie'][0];
    }

    public async search(alias: String): Promise<Record<string, string>> {
        if (!this.cookie || this.cookie === "") {
            await this.login();
        }

        const url = `https://pwa.uni-hildesheim.de/personal/search/userOverview.jsp?dn=uid%3D${alias}%2Cou%3DPeople%2Cdc%3Duni-hildesheim%2Cdc%3Dde`;
        const data = await new RequestBuilder()
            .url(url)
            .header('Cookie', this.cookie)
            .POST({})
            .textResponse()
            .buildAndExecute();
            
        const body: string = data.data;
        const $ = cheerio.load(body);
        const person: Record<string, string> = {
        }
        
        for(let i = 2; i <= 14; i++) {
            let header = $('body > table > tbody > tr:nth-child(2) > td:nth-child(2) > table.pageTable > tbody > tr > td.page > div > table > tbody > tr > td > table > tbody > tr:nth-child('+i+') > td.formHeader').text().trim();
            let data = $('body > table > tbody > tr:nth-child(2) > td:nth-child(2) > table.pageTable > tbody > tr > td.page > div > table > tbody > tr > td > table > tbody > tr:nth-child('+i+') > td.formData').text().trim();
            
            header = header.toLocaleLowerCase();
            header = header.split("/")[0].trim();
            header = header.replace("geb�ude", "raum")
                .replace("akademischer grad", "akademischerGrad")
                .replace("e-mail", "eMail")
                .replace("externe einrichtung", "externeEinrichtung");
            data = data.replace(/(?:\r\n|\r|\n|\s{3,})/g, '/').trim();
            person[header] = data;
        }
        
        return person;
    }



}

export default PwaService;