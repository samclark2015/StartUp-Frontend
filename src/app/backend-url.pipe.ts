import { Pipe, PipeTransform } from '@angular/core';
import { ConfigService } from './config.service';

@Pipe({
  name: 'backendUrl'
})
export class BackendUrlPipe implements PipeTransform {

  constructor(private configService: ConfigService) {

  }

  transform(value: string): string {
    let url = new URL(value, this.configService.apiBase);
    return url.toString();
  }

}
