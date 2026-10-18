import config from 'config';
import { CreateUserDto } from '@dtos/users.dto';
import HttpException from '@exceptions/HttpException';
import { TokenData } from '@interfaces/auth.interface';
import { User } from '@interfaces/users.interface';
import { isEmpty, isUniMail } from '@utils/util';
import { accessMail } from '@utils/mail-texts';
import { signToken, TokenExpiredError, verifyToken } from '@utils/token';
import MailService from './mail.service';
import { statsService } from './stats.service';

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
    const lang = userData.lang ?? 'de';
    const { subject, text } = accessMail(lang, createdUser.email, config.get('domain') + "/browse?token=" + tokenData.token, tokenData.expires);
    await mail.mail(createdUser.email, subject, text);
    statsService.record('anmeldung', lang);

    return { userInfo: createdUser };
  }

  public async validate(tokenData: TokenData): Promise<Boolean> {
    if (isEmpty(tokenData)) throw new HttpException(401, "Not valid");
    if (isEmpty(tokenData.token)) throw new HttpException(401, "Not valid");
    try {
      verifyToken(tokenData.token);
    } catch (e) {
      // Only reached for correctly signed tokens, so this reveals nothing about forged ones
      throw new HttpException(401, e instanceof TokenExpiredError ? "Expired" : "Not valid")
    }

    return true;
  }

  public createToken(user: User): TokenData & { expires: Date } {
    return signToken({ email: user.email });
  }
}

export default AuthService;
