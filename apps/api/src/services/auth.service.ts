import config from 'config';
import jwt from 'jsonwebtoken';
import { CreateUserDto } from '@dtos/users.dto';
import HttpException from '@exceptions/HttpException';
import { DataStoredInToken, TokenData } from '@interfaces/auth.interface';
import { User } from '@interfaces/users.interface';
import { isEmpty, isUniMail } from '@utils/util';
import MailService from './mail.service';

class AuthService {

  public async signup(userData: CreateUserDto): Promise<{ userInfo: User }> {
    if (isEmpty(userData)) throw new HttpException(400, "You're not userData");
    if (isEmpty(userData.email)) throw new HttpException(400, "Your email address is empty");
    if (!isUniMail(userData.email)) throw new HttpException(400, "Your email address is not an uni mail address");

    const createdUser: User = {
      email: userData.email
    };

    const tokenData = this.createToken(createdUser);

    const mail = new MailService();
    await mail.mail(createdUser.email, "Dein Lernmaterial-Verteiler Zugang", "Hallo " + createdUser.email 
      + ", \n\nmit dem folgenden Link erhältst du deinen persönlichen Zugang zur Lernmaterial-Sammlung "
      + "\nder Fachschaft Informatik. Behalte diese E-Mail gut auf, da du nur mit diesem Link Zugang zur "
      + "\nSammlung erhältst. Solltest du den Link trotzdem mal verlieren, kannst du dir ebenfalls einen "
      + "\nneuen zuschicken lassen. "
      + "\n\nDein Link lautet: \n\n " + config.get('domain') + "/browse?token=" + tokenData.token 
      + "\n\nViele Grüße,\ndeine Informatik Fachschaft 💻!");

    return { userInfo: createdUser };
  }

  public async validate(tokenData: TokenData): Promise<Boolean> {
    if (isEmpty(tokenData)) throw new HttpException(401, "Not valid");
    if (isEmpty(tokenData.token)) throw new HttpException(401, "Not valid");
    const secretKey: string = config.get('secretKey');
    try {
      if (!jwt.verify(tokenData.token, secretKey)) {
        throw new HttpException(401, "Not valid");
      }
    } catch (e) {
      throw new HttpException(401, "Not valid")
    }
  
    return true;
  }

  public createToken(user: User): TokenData {
    const dataStoredInToken: DataStoredInToken = { email: user.email };
    const secretKey: string = config.get('secretKey');

    return { token: jwt.sign(dataStoredInToken, secretKey) };
  }
}

export default AuthService;
