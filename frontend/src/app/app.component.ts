// Angular import
import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

// project import
import { SpinnerComponent } from './theme/shared/components/spinner/spinner.component';
import { ToastNotificationsComponent } from './theme/shared/components/toast-notifications/toast-notifications.component';
import { ThemeModeService } from './core/theme/theme-mode.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [RouterOutlet, SpinnerComponent, ToastNotificationsComponent]
})
export class AppComponent implements OnInit {
  title = 'Berry Angular Free Version';

  constructor(private readonly themeModeService: ThemeModeService) {}

  ngOnInit(): void {
    this.themeModeService.initializeTheme();
  }
}
