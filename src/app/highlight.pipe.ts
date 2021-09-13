import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'highlight'
})
export class HighlightPipe implements PipeTransform {

  constructor(private sanitizer: DomSanitizer) {

  }

  transform(text: string, query: string): SafeHtml {
    let matchOperatorsRe = /[|\\{}()[\]^$+*?.]/g;
    query = query.replace(matchOperatorsRe, '\\$&');

    let replacement = query !== "" ? "<span style='background-color: yellow'>$1</span>" : "$1";
    let re = new RegExp("(" + query + ")", 'gi');
    return this.sanitizer.bypassSecurityTrustHtml(text.replace(re, replacement));
  }

}
