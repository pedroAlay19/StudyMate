import { Controller, Get } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { ActiveUser } from '../auth/decorators/active-user.decorator';
import type{ JwtPayload } from '@supabase/supabase-js';
import { Auth } from '../auth/decorators/auth.decorator';
import { UserRole } from '../users/entities/user.role';

@Controller('alerts')
@Auth(UserRole.STUDENT)
export class AlertsController {
    constructor(private readonly alertsService: AlertsService) {}

    @Get()
    getAlerts(@ActiveUser() user: JwtPayload) {
        return this.alertsService.findAlertsByUserId(user.sub);
    }
}
