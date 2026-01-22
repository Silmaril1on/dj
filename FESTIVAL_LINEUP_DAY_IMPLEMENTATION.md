# Festival Lineup Day & Time Implementation

## Overview

This implementation adds day and performance time tracking for each artist in festival lineups, allowing festival owners to precisely organize their lineup by days and schedule.

## Database Changes

### SQL Migration Script

Run the following SQL to add the necessary fields to your `festival_lineup` table:

```sql
-- Add artist_day column to festival_lineup table
ALTER TABLE festival_lineup
ADD COLUMN artist_day TEXT;

-- Add performance_time column for more precision (optional but recommended)
ALTER TABLE festival_lineup
ADD COLUMN performance_time TEXT;

-- Create an index for faster queries by day
CREATE INDEX idx_festival_lineup_artist_day ON festival_lineup(artist_day);

-- Optional: Create index for performance_time
CREATE INDEX idx_festival_lineup_performance_time ON festival_lineup(performance_time);
```

### Data Structure

**Before:**

```json
{
  "stage_name": "Main Stage",
  "artists": ["Fisher", "Carl Cox", "Nina Kraviz"]
}
```

**After:**

```json
{
  "stage_name": "Main Stage",
  "artists": [
    {
      "name": "Fisher",
      "day": "Sunday",
      "time": "20:00"
    },
    {
      "name": "Carl Cox",
      "day": "Saturday",
      "time": "22:00"
    },
    {
      "name": "Nina Kraviz",
      "day": "Friday",
      "time": "23:30"
    }
  ]
}
```

## Features Implemented

### 1. Day Selection Per Artist

- Each artist can be assigned to a specific day (Monday-Sunday)
- Dropdown selection with all weekdays
- Optional field (can be left empty if day not announced yet)

### 2. Performance Time (Optional)

- Time picker for specific performance times
- Helps with scheduling and prevents conflicts
- Optional field for flexibility

### 3. Lineup Status (Announcement Phases)

- **First Phase**: Initial lineup announcement
- **Second Phase**: Additional artists revealed
- **Last Phase**: Complete lineup finalized
- Stored in `festivals.lineup_status` field

## Form UI Features

### Artist Card Layout

Each artist entry now includes:

- **Artist Name** (required)
- **Day** (optional dropdown: Monday-Sunday)
- **Performance Time** (optional time picker)
- **Remove Button** (if multiple artists)

### Benefits

1. **Precise Scheduling**: Festival owners can plan exact performance schedules
2. **Day-by-Day Organization**: Filter and display artists by day
3. **Time Conflict Prevention**: Avoid booking same stage at same time
4. **Progressive Announcements**: Track which phase of lineup release
5. **Better UX for Attendees**: Users can see who performs when

## API Changes

### Updated Endpoints

**GET `/api/festivals/add-festival-lineup`**

- Returns artists with `artist_day` and `performance_time`

**POST `/api/festivals/add-festival-lineup`**

- Accepts artist objects with `name`, `day`, and `time`
- Saves `lineup_status` to festivals table

**PATCH `/api/festivals/add-festival-lineup`**

- Updates artist day and time information
- Updates `lineup_status` in festivals table

## Usage Example

### Adding Lineup with Days

```javascript
const lineupData = {
  festival_id: "123",
  festival_name: "Ultra Music Festival",
  lineup_status: "first phase",
  stages: [
    {
      stage_name: "Main Stage",
      artists: [
        {
          name: "Fisher",
          day: "Sunday",
          time: "20:00",
        },
        {
          name: "Carl Cox",
          day: "Saturday",
          time: "22:00",
        },
      ],
    },
    {
      stage_name: "Techno Stage",
      artists: [
        {
          name: "Nina Kraviz",
          day: "Friday",
          time: "23:30",
        },
      ],
    },
  ],
};
```

## Best Practices

### 1. Data Consistency

- Always store day names in consistent format (capitalize first letter)
- Use 24-hour format for times (e.g., "20:00" not "8:00 PM")
- Store NULL for optional fields if not set

### 2. Validation

- Ensure at least artist name is provided
- Day and time are optional for flexibility
- Validate time format if provided

### 3. Display Logic

When displaying lineups to users:

- Group artists by day
- Sort by performance time within each day
- Show TBD/TBA for artists without day/time
- Highlight current day or upcoming performances

### 4. Querying

```sql
-- Get all artists performing on Saturday
SELECT * FROM festival_lineup
WHERE artist_day = 'Saturday'
ORDER BY performance_time;

-- Get lineup for specific stage on specific day
SELECT fl.* FROM festival_lineup fl
JOIN festival_stages fs ON fl.stage_id = fs.id
WHERE fs.stage_name = 'Main Stage'
AND fl.artist_day = 'Sunday'
ORDER BY fl.performance_time;
```

## Future Enhancements

Consider adding:

1. **Multi-day performances**: Artist performing multiple days
2. **Set duration**: How long each artist performs
3. **B2B sets**: Joint performances
4. **Special guests**: TBA/surprise artists
5. **Conflict checker**: Alert if same artist booked twice at same time
6. **Auto-scheduling**: Suggest optimal time slots

## Migration Guide

If you have existing lineup data:

```sql
-- Backup existing data first
CREATE TABLE festival_lineup_backup AS
SELECT * FROM festival_lineup;

-- Add new columns
ALTER TABLE festival_lineup
ADD COLUMN artist_day TEXT,
ADD COLUMN performance_time TEXT;

-- All existing artists will have NULL for day and time
-- You can manually update them or leave as TBA
```

## Summary

This implementation provides a professional, scalable solution for managing festival lineups with day-specific scheduling. The architecture is flexible enough to handle various scenarios while maintaining data integrity and providing a great user experience for festival organizers.
