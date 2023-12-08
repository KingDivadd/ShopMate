# DOCUMENTATION FOR THE BACKEND

1. Backend API Endpoint:

   - Base URL:
   - for authentication/authorization for the use of protected features (like update of vehicle info, removing of users, transfer of drivers, etc), JWT token in the form of bearer token was used.

2. Available API Endpoints:

   1. Authenticaton Schema

      1. signup [ POST request] => /api/auth/signup
         ## Required Info
         1. lastName 2. firstName 3. email 4. phone 5.role => ['driver', 'vehicle_asignee', 'vehicle_coordinator', 'maintenance_personnel'] 6. staffId 7. pic 8. password
      2. login [ POST request] => /api/auth/login
         ## Required Info
         1. email_staffId 2. password
      3. Password recovery code [ POST request] => /api/auth/password-recovery-code
         ## Required Info
         1. email
      4. Verify Recovery code [ POST request] => /api/auth/recovery-code-verify
         ## Required Info
         1. email 2. code
      5. Recover Password => /api/auth/recover-password
         ## Required Info
         1. email 2. password (this will be the new password)

   2. User Schema

      1. Get all users [ GET request ]=> /api/user/all-users
         ## Required info
         1. Bearer token for authorization [to get logged in user info and filter it out from the users array]
      2. Filter / search for user [ POST request] => /api/user/filter-users
         ## Required info
         1. Any of [ 1. firstName 2. lastName 3. dept 4. role ]
         # this shows all the users including the logged in user
      3. Update / edit user info [PATCH request] => /api/user/update-user-info
         ## Required Info
         1. user_id and any of [1. firstName, 2. lastName, 3. staffId, 4. phone, 5. pic]
         2. Bearer token for authorization [so only a logged in user can update his profile and his alone]
      4. Assign Driver [PATCH request] => /api/user/assign-driver
         ## Required Info
         1. Bearer token for authorization [so that only user logged in as vehicle coordinator can perform operation]
         2. Both of [1. assignee_id, 2. driver_id]
      5. Remove Driver [PATCH request] =>/api/user/remove-driver
         ## Required Info
         1. Bearer token for authorization [so that only user logged in as ''vehicle_coordinator' can perform operation]
         2. assignee_id [we are woking on the assumption that only a driver is assigned to an assignee]
      6. Remove User [DELETE request] => /api/user/delete-user
         ## Required Info
         1. Bearer token for authorization [so that only user logged in as ''vehicle_coordinator' can perform operation]
         2. assignee_id [we are woking on the assumption that only a driver is assigned to an assignee]

   3. Branch Schema

   4. Product Schema

3. Data Formats:

   - The API primarily returns data in JSON format. Ensure that your frontend can handle JSON responses.

4. API Data Result:
   1. For successful data fetch.
   - .userInfo
   2. For errors
   - .err
   3. For messages
   - .msg
