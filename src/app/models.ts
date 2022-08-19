export interface DashboardView {
  "bad_servers": DashboardItem[];
}

export interface DashboardItem {
  "name": string;
  "console_file_path": string;
  "url": string;
  "id": number;
}

export interface Action {
  title: string;
  method: string;
  primary: boolean;
  related_attr: string;
  protected: boolean;
}

export interface SysMonStatus {
  "Name": string;
  "LastStatus": string;
  "LastChecked": string;
  "time_t": number;
  "LastStartAttempt": string;
  "StatusString": string;
  "SendAlarm": string;
  "SystemMonitorName": string;
  "ProcessName": string;
  "AlarmDisplay": string;
  "Type": string;
  "LastAlarmSent": string;
}

export interface Server {
  id: number;
  name: string;

  url: string;
  actions: Action[];

  sysmon_status: SysMonStatus;
  details: {title: string; value: any;}[];
}