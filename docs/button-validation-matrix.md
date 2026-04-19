# Button Validation Matrix

## Frontend (Patient/Doctor)

| Button/Action | Route/Endpoint | Expected Behavior | Current Status |
| --- | --- | --- | --- |
| Login submit | `/login` -> `POST /api/v1/user/login` | Logs in patient/doctor and redirects by role | Implemented + loading state |
| Register submit | `/register` -> `POST /api/v1/user/patient/register` | Creates patient account and authenticates session | Implemented + loading state |
| Navbar Login | client route | Navigates unauthenticated user to login | Implemented |
| Navbar Logout | `GET /api/v1/user/patient/logout` or `GET /api/v1/user/doctor/logout` | Clears session and redirects to login | Implemented + loading state |
| Appointment submit | `/appointment` -> `POST /api/v1/appointment/post` | Creates appointment for authenticated patient | Implemented + loading state |
| Cancel appointment | `/my-appointments` -> `DELETE /api/v1/appointment/patient/cancel/:id` | Cancels only pending patient appointment | Implemented + loading state |
| Message submit | home contact section -> `POST /api/v1/message/send` | Sends contact message with validation/rate limit | Implemented + loading state |

## Dashboard (Admin)

| Button/Action | Route/Endpoint | Expected Behavior | Current Status |
| --- | --- | --- | --- |
| Admin login submit | `/login` -> `POST /api/v1/user/login` with role Admin | Authenticates admin and opens dashboard | Implemented + loading state |
| Add admin submit | `/admin/addnew` -> `POST /api/v1/user/admin/addnew` | Creates a new admin user | Implemented + loading state |
| Add doctor submit | `/doctor/addnew` -> `POST /api/v1/user/doctor/addnew` | Registers doctor with avatar upload | Implemented + loading state |
| Appointment status dropdown | `/` -> `PUT /api/v1/appointment/update/:id` | Updates status within allowed enum | Implemented + row lock |
| Appointment delete button | `/` -> `DELETE /api/v1/appointment/delete/:id` | Deletes appointment after confirmation | Implemented |
| Sidebar logout icon | sidebar -> `GET /api/v1/user/admin/logout` | Clears admin session and redirects login | Implemented + click guard |

## Test Coverage Mapping

| Layer | Coverage |
| --- | --- |
| Backend integration | Protected-route rejection + message payload validation |
| Frontend smoke | Login, Register, Message form render checks |
| Dashboard smoke | Login, Add Admin, Add Doctor render checks |
