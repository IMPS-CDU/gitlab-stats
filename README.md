# Gitlab Stats
Script to load gitlab commit statistics for a user

Usage: index [options]

Options:
  -t, --token <token>  Personal access token
  -u, --url <url>      Gitlab base URL
  -s, --since [since]  Date to load commits since (optional)
  -e, --until [until]  Date to load commits until (optional)
  -h, --help           output usage information


## Autentication
Authentication uses a personal access token. To use the script you will need to [create a token](https://docs.gitlab.com/ce/user/profile/personal_access_tokens.html) and pass it to the script using the token argument.
