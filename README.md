# PROPERTY LISTINGS TRACKER

This application tracks real estates listed on a 3rd Party API

## Setup

1. Copy the `.env-example` and rename to `.env`
2. Run `yarn install` to fetch dependencies
3. Run `yarn up` to start project 
4. Open `http://localhost:3001/` to access application. The default port can be changed in `.env`'s `APP_PORT` variable.
5. Play Around!

*** see `package.json` for a list of other commands available when working with the project ***

## Possible Improvements
Codebase could benefit from refactors and improvements such as:
- Implement input validation to the apis
- Better logging
- Add styling/linting - code quality uniformity checks on commit
- Containerize make ready for deployment
- Add separate configs for dev, prod, staging
- Tests and Coverage (SEE BELOW FOR A NOTE ON TESTS)
- Migrations

## Technical Notes
> ***Where date is required while posting to api, the format will be `yyyy-mm-dd`***
- The server is running on port 3001 by default. You can change this in the `.env` file
- To authenticate users use the `getProfile` middleware that is located under src/middleware/getProfile.js. users are authenticated by passing `profile_id` in the request header. after a user is authenticated his profile will be available under `req.profile`. make sure only users that are on the contract can access their contracts.
- 
### App Components

Laid out in respective directory by function. Important ones are

- Models - `src/models/`
- Controllers - `src/controllers`
- Middleware - `src/middleware`
- Services - `src/services`

---

# Architecture Overview
Assumptions:
    1. Property Listings returned from 3rd party API are subject to change
    2. 

- Property `Listings` (Simply referred to as `Listings`) are fetched from 3rd Party API and displayed in Frontend. 
- `Listings` are identified by the `propertyCode` returned for each of them when calling the API.
- For each of the `Listings` a `ListingExpression` is created in the `listing_expressions`s table.
- `ListingExpressions`s are simply used to track the various ***versions*** of a `Listing`. An assumption is made that the results from the 3rd party API could change either by new property listings being returned OR previously fetched listings being modified.
- In the case that A previously unencountered property listing is returned from the API, it creates a new `Listing` in the system, with a single `Expression` (ListingExpression) associated with it also created in the `listing_expressions` table.
- If a previously encountered listing comes back with some modifications detected, a new Expression is created for it under the previously stored `Listing`.
- In the Frontend, we can view a list of `Listings` in the system and for each of them a view can be loaded to view all `expressions` associated with it.
- We can also Edit any expression of a `Listing` which will cause a new `Expression` to be created in the `listing_expressions` table and it is associated to it's parent `Listing` using the `listingId` foreign key.
- Everytime a new Listing is created with it's associated expression, the expression is hashed and this hash is stored under the Listing. It is this hash that we use to check for changes on properties that are brought back by the API
- Since the process of refreshing listings from the 3rd party API can be time consuming, we introduce a simple `job` queue to track the update process, and once all listings have been fetched and new `listings` and/or `expressions` - if any - created, the frontend can then update the latest version of Listings from DB.
- We can preview all expressions of a listing, edit or delete them in the frontend.
- All deletions are soft deleted and can be restored (Yet to be consumed in frontend but API endpoint does exist)

- There's 3 tables in the App:
    - `listings` -> Stores the Unique properties fetched into the System.
    - `listing_expressions` -> Stores the various versions of a Listing.
    - `jobs` -> Track Update requests to the 3rd party API

In Summary

#### Listing
This is the Unique property Listing returned from the 3rd API

#### ListingExpression
The various versions of a `Listing` which can be created in two ways:  
    1.   A change detected up-stream or  
    2.   An edit to any expression locally  

#### Job
Used to track upstream update requests and local reconciliation after an update fetch is succesful.
Jobs have 4 states:  
    1. **-1** - Failed,  
    2. **0** - Fetching from API  
    3. **1** - Updating DB, creating Listings and/or expressions   
    4. **2** - Succes  

  

## APIs Implemented

Below is a list of the available API's for the application.


1. ***GET*** `/listings` - Returns all non-deleted listings with at least one expression

2. ***GET*** `/listings/:id` - Returns a Single Listing with all it's non-deleted expressions  

3. ***DELETE*** `/listings/:id` - Returns a Single Listing with all it's non-deleted expressions  

