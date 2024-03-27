import { Pipe, PipeTransform } from '@angular/core';
import { environment } from 'src/environments/environment';

@Pipe({
  name: 'backendUrl'
})
export class BackendUrlPipe implements PipeTransform {

  transform(value: string): string {
    let url = new URL(value, environment.apiBase);
    return url.toString();
  }

}
