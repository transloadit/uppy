#!/bin/bash

# Log file to store the results
LOGFILE="link_check_log.txt"

# Clear the log file if it exists
> $LOGFILE

# Base directory where you want to scan (the parent of bin)
BASE_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# Find all .md files in the project directory and subdirectories, excluding node_modules
find "$BASE_DIR" -path "$BASE_DIR/node_modules" -prune -o -print | while read -r file; do
  echo "Scanning $file for broken links..."

  # Make the file path relative to BASE_DIR to remove the './bin/../' part
  real_file="${file#$BASE_DIR/}"

  # Use sed to extract URLs from Markdown format ([text](url))
  # This matches URLs within parentheses after a closing square bracket
  sed -n 's/.*](\([^)]*\)).*/\1/p' "$file" | while IFS=: read -r url; do
    # Get the line number by searching for the URL
    line=$(grep -n "$url" "$file" | cut -d: -f1)

    # Check if URL is valid by getting the HTTP status code
    status_code=$(curl -o /dev/null --silent --head --write-out "%{http_code}" "$url")

    # Print and log only if status is 404 (error)
    if [ "$status_code" -eq 404 ]; then
      output="Broken link found: File: $real_file | Line: $line | URL: $url | Status: ERROR (404)"
      echo "$output" | tee -a $LOGFILE
    fi
  done
done

echo "Link check completed. Results saved in $LOGFILE." | tee -a $LOGFILE
