# Exercises Data

This directory contains the JSON data for the couples therapy exercises.

## Structure

The `exercises.json` file contains an array of exercise objects, each with:

- `id`: Unique identifier for the exercise
- `title`: Display name of the exercise
- `steps`: Array of step objects that make up the exercise

Each step contains:
- `Activity`: The name of the activity
- `Description`: Instructions for the activity
- `How much?`: Expected response length
- `Language`: Suggested language/phrasing to use
- `Partner 1 text input`: Field for partner 1's response (empty by default)
- `Partner 2 text input`: Field for partner 2's response (empty by default)
- `Finished (checkbox)?`: Completion status (false by default)
