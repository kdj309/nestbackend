import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { signInDto } from './dto/signin-user.dto';
import { getSuccessResponse } from 'src/utils';
import { Response ,Request} from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async signIn(
    @Body() signInDto: signInDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    try {
      const authresponse = await this.authService.signIn(
        signInDto.email,
        signInDto.password,
      );
      response.cookie('access-token', authresponse.data.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Should be true in production
        domain: 'localhost', // Specify the domain correctly
        path: '/',
        maxAge:15* 60 * 1000
      });
      response.cookie('id', authresponse.data.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Should be true in production
        domain: 'localhost', // Specify the domain correctly
        path: '/',
      });
      response.cookie('refresh-token', authresponse.data.refreshtoken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        domain: 'localhost',
        path: '/',
        maxAge:7 * 24 * 60 * 60 * 1000
      });
      delete authresponse.data.access_token;
      delete authresponse.data.refreshtoken;
      return authresponse;
    } catch (error) {
      return {
        status: 'Failure',
        error: error.message,
      };
    }
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async signOut(
    @Req() req: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    response.clearCookie('access-token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Use secure cookies in production (HTTPS)
      domain: 'localhost', // Or your domain
      path: '/', // Clear cookie for all routes
    });
    response.clearCookie('id', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Use secure cookies in production (HTTPS)
      domain: 'localhost', // Or your domain
      path: '/', // Clear cookie for all routes
    });
    response.clearCookie('refresh-token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Use secure cookies in production (HTTPS)
      domain: 'localhost', // Or your domain
      path: '/', // Clear cookie for all routes
    });
    return getSuccessResponse(null, 'SignOut Successfully');
  }

  @Post('refresh')
  async createRefreshToken(@Req() request:Request,@Res() response:Response) {
    try {
      const refreshToken = request.cookies['refresh-token'];
      const newtokenresponse=await this.authService.verifyAndGenerateNewToken(refreshToken)
      response.cookie('refresh-token', newtokenresponse.data.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/'
      });
      response.cookie("access-token",newtokenresponse.data.accessToken,{
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 15 * 60 * 1000, // 15 mintues
          path: '/'
      })
      delete newtokenresponse.data.refreshToken;
      delete newtokenresponse.data.accessToken;
      response.json(newtokenresponse)
    } catch (error) {
      throw error
    }
  }
}
