import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  loginForm = new FormGroup({
    username: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required]),
  });

  constructor(private auth: AuthService, private route: ActivatedRoute, private router: Router) { }

  ngOnInit(): void {
  }

  async handleSubmit() {
    let { username, password } = this.loginForm.value;
    try {
      await this.auth.doTokenAuth(username, password);
      let next = this.route.snapshot.params["next"] || "/";
      this.router.navigateByUrl(next);
    } catch {
      alert("Error!");
    }
  }
}
