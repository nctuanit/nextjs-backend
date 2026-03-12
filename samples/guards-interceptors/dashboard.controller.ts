import { Controller, Get, Headers, UseGuards, UseInterceptors } from '../../index';
import { AuthGuard } from './auth.guard';
import { LoggingInterceptor } from './logging.interceptor';

@Controller('/dashboard')
@UseInterceptors(LoggingInterceptor) // Interceptor covers all routes in this controller
export class DashboardController {

  @Get()
  getPublicInfo() {
    return {
       status: 'Public Route',
       message: 'Anyone can see this.'
    };
  }

  @Get('/private')
  @UseGuards(AuthGuard) // Guard protects only this specific route
  getPrivateInfo(@Headers('authorization') auth: string) {
     return {
        status: 'Protected Route',
        message: 'You have top secret clearance.',
        provided_token: auth
     };
  }
}
