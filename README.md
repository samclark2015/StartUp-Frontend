# StartUp Frontend

This tool was written using Angular, and interfaces with a REST API written in Django (Python) for backend data and business logic. It's highly interactive and integrated with existing systems utilized by users.

Below is a sample of the user interface design of the application:
![Screenshot of Dashboard User Interface](/docs/dashboard.png "Dashboard Interface")

## Product Overview
StartUp manages the status of servers/managers and viewing of log files. These features may be toggled by the buttons located in the top bar. Options are available to the right of the top bar to login and logout, adjust user settings, and view the history of all server actions taken by users.

### Servers
The servers section provides basic capabilities to start, stop, and check servers; to view actions taken on a particular server in the past; a recent status summary; and an overview of the server's System Monitor status (if available). More details can be found here.

### Log Files
The log files section provides easy access to various log files available in the original StartUp application. The interface is relatively simple, with all available files listed in the left bar, and the contents displayed on the right when selected.

## Other Features
### Authentication
StartUp supports authentication by way of users' credentials. This is necessary so it can be tracked who performs protected actions like starts and stops. Additionally, to facilitate use on shared systems, integration with ScreenLock works to automatically log users in based on who is active on these systems.

### All Events
This view provides users a way to view all events for all servers. This is accessed by way of the drop-down in the top bar, adjacent to the Login button. This list may be filtered via a search query at the top of the view.

### Settings
Three settings currently exist: 
* Backend Host 
* Server Tree View (displays 2 column view vs 3 column in server section) 
* Log Update Frequency (how often to poll for new event log entries).

### Server Dashboard
When StartUp is initially accessed, the server dashboard is displayed. This is a simple listing of any servers whihc have a bad System Monitor status for easy troubleshooting. Each entry is linked to the associated server entry for more details. 

## Single Server
### Selection
The servers section offers users a list of servers to select in the second column of the page. This list may be filtered in two ways: a category may be selected in the leftmost column to show only servers in that category, and servers may additionally be filtered against a query typed into the search box at the top of the second column. This filtering happens while you type, for responsive feedback. Multiple servers may be selected by way of control+clicking (or command+clicking on MacOS) more than one server in the list.

### Details
In addition to selecting servers, a third, rightmost column offers details on the server(s) selected. At the top of this pane, the name of the server is displayed along with management options Start, Stop, Restart, and Check. When starting or restarting, the selected action is performed followed by a check to ensure the server was successfully started. The first three options listed (the protected options) require a user to be authenticated with the site.

Directly below this are one or two panes showing an overview and System Monitor details. The overview pane simply shows the most recent log entry so server status can be determined quickly. To the left of this, if the server is watched, will be the System Monitor pane; this displays current System Monitor information for the server such as the status; the date and time of the last check, last start, and last alarm; and the monitor watching this server.

Next is a Details pane, which offers more information on the selected server. This is analogous to what is provided by the Describe option in the old StartUp. Users may view commands for each option, as well as additional data on the server. If no additional details are available, this section will be hidden.

At the bottom is a scrolling pane of actions performed on this server. This is a simple listing, with an icon to indicate a visual status, the date and time when the event was reported, an optional associated user, and a longer description of the event and details on its outcome. This will display the union of events when multiple servers are selected.

### Editing
Selecting the Edit StartUp Entry link to the right of the server name will allow editing a server entry. If on a C-AD machine, this will launch the StartUp Editor program with the current server open for editing.

