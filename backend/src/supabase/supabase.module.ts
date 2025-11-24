import { Module, Global } from '@nestjs/common';
import { SupabaseService } from './supabase.service';
import { ConfigModule } from '@nestjs/config';

@Global() // Para que esté disponible en toda la app sin tener que importarlo
@Module({
  imports: [ConfigModule],
  providers: [SupabaseService],
  exports: [SupabaseService], // Exportar para usar en otros módulos
})
export class SupabaseModule {}