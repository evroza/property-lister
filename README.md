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
### Legend:
[X] - Implemented in backend and currently being consumed by frontend  
[ ] - Implemented in backend but currently not being consumed  


1. ***GET*** `/listings` - Returns all non-deleted listings with at least one expression [X]

2. ***GET*** `/listings/:id` - Returns a Single Listing with all it's non-deleted expressions   [X]

3. ***DELETE*** `/listings/:id` - Soft deletes a property listing  [X]

3. ***PUT*** `/listings/:id` - Restore a listing only if it had been deleted  [ ]

4. ***GET*** `/listings/:id/expressions` - Returns all expressions for a property Listing whether deleted or live.   [ ]

5. ***GET*** `/listings/:id/expressions/:expressionId` - Returns a Single expression if it's not marked as deleted and belongs to the listing with  id == `:id`  [X]

6. ***DELETE*** `/listings/:id/expressions/:expressionId` - Soft delete an expression  [X]

7. ***PUT*** `/listings/:id/expressions/:expressionId` - Restore  a deleted expression  [ ]

8. ***POST*** `/listings/:id/expressions/:expressionId` - Create a new expression for the Listing with id == `:id`. The post body should contain the new expression's metadata (This is called when we edit and save an expression on the frontend)  [X]



### Tests -- To be implemented
Unfortunately are yet to be implemented for the various features, there was trouble setting up Jest with typescript due to known issues associated with using jest on projects where `module-alias` and potentially `sequalize` has been used.

Couldn't finish setting up the jest compilation for now. 




# Example requests

```

### By Design, we Don't provide endpoint to directly access expression without knowing it's listing ID to make bruteforcing less direct

### Get all Listings
## If we get status 202 it means the app is fetching Listings from 3rd party API and has instead returned Job ID
GET http://localhost:3001/listings

### GET Single listing with all it's expressions - EXCLUDES DELETED EXPRESSIONS
GET http://localhost:3001/listings/126

### DELETE Single listing - will NOT delete it's expressions - thus if listing restored, previous state of expressions retained
DELETE  http://localhost:3001/listings/3

### RESTORE a deleted listing by id - just listing, expressions retain previous state before listing deletion. 
PUT  http://localhost:3001/listings/3

### GET Expressions for a listing -> Return ALL expressions for listing INCLUDING deleted expressions - This could allow us to view and
### recover listings with all expressions deleted since we can view ALL expressions for a listing and potentially modify their status
GET http://localhost:3001/listings/3/expressions

### Get expression with specified ID which falls under listing with specified ID
### 404 not found
### 403 found but forbidden (Expression is deleted)
GET http://localhost:3001/listings/126/expressions/160

### DELETE Expression with specified ID for the listing with specified ID
## If all expressions for listing have alreadt deleted then listing also deleted
DELETE http://localhost:3001/listings/126/expressions/157

### RESTORE Expression with specified ID for the listing with specified ID
## If Listing had been deleted then restore it too and set active expression to the restored one
PUT http://localhost:3001/listings/126/expressions/157

### Update listings from 3rd parrty API
GET http://localhost:3001/updates

###
GET http://localhost:3001/updates/48

###
### Edit expression (creates new expression) and returns it's ID in response
POST http://localhost:3001/listings/126/expressions/133
content-type: application/json

{"property":{"appCode":"","locale":"en-US","propertyCode":"fqeA","name":"Citadines St Georges Terrace Perth","starRating":4,"location":{"address":"No 185 St Georges Terrace","city":"Perth","country":"AU","countryCode":"AU","postalCode":"6000","stateProvince":null,"latLng":{"lat":-31.953843,"lng":115.853637}},"trustYou":{"score":87,"reviewsCount":1245,"key":"pos3"},"checkInTime":null,"checkOutTime":"11:00:00.000000","contacts":{"phone":"61-8-92263355","fax":"","email":"","website":null},"airportCode":"","heroImage":{"caption":"","url":"https://property-gallery.rakutentravelxchange.com/fqeA/QK0XAKe6.jpg"},"gallery":[{"s":{"caption":"Room","url":"https://property-gallery.rakutentravelxchange.com/fqeA/6pPwg8p6.jpg"},"m":{"caption":"Room","url":"https://property-gallery.rakutentravelxchange.com/fqeA/6pPwg8p6.jpg"}},{"s":{"caption":"Room","url":"https://property-gallery.rakutentravelxchange.com/fqeA/6OalKrN4.jpg"},"m":{"caption":"Room","url":"https://property-gallery.rakutentravelxchange.com/fqeA/6OalKrN4.jpg"},"xs":{"caption":"Room","url":"https://property-gallery.rakutentravelxchange.com/fqeA/6OalKrN4.jpg"},"l":{"caption":"Room","url":"https://property-gallery.rakutentravelxchange.com/fqeA/6OalKrN4.jpg"},"xl":{"caption":"Room","url":"https://property-gallery.rakutentravelxchange.com/fqeA/6OalKrN4.jpg"}},{"s":{"caption":"Room","url":"https://property-gallery.rakutentravelxchange.com/fqeA/QMbE8rn6.jpg"},"m":{"caption":"Room","url":"https://property-gallery.rakutentravelxchange.com/fqeA/QMbE8rn6.jpg"},"xs":{"caption":"Room","url":"https://property-gallery.rakutentravelxchange.com/fqeA/QMbE8rn6.jpg"},"l":{"caption":"Room","url":"https://property-gallery.rakutentravelxchange.com/fqeA/QMbE8rn6.jpg"},"xl":{"caption":"Room","url":"https://property-gallery.rakutentravelxchange.com/fqeA/QMbE8rn6.jpg"}},{"s":{"caption":"Room","url":"https://property-gallery.rakutentravelxchange.com/fqeA/72M9RAl6.jpg"},"m":{"caption":"Room","url":"https://property-gallery.rakutentravelxchange.com/fqeA/72M9RAl6.jpg"}},{"s":{"caption":"Room","url":"https://property-gallery.rakutentravelxchange.com/fqeA/6l1rzJm7.jpg"},"m":{"caption":"Room","url":"https://property-gallery.rakutentravelxchange.com/fqeA/6l1rzJm7.jpg"},"xs":{"caption":"Room","url":"https://property-gallery.rakutentravelxchange.com/fqeA/6l1rzJm7.jpg"},"l":{"caption":"Room","url":"https://property-gallery.rakutentravelxchange.com/fqeA/6l1rzJm7.jpg"},"xl":{"caption":"Room","url":"https://property-gallery.rakutentravelxchange.com/fqeA/6l1rzJm7.jpg"}}],"categoryId":1,"facilities":[183,147,9,141,15,259,42,5,121],"reviews":{"summary":{"globalPopularity":36.508743,"highlightList":[{"categoryIdList":["244","21b","21"],"confidence":100,"text":"Fully equipped gym"},{"categoryIdList":["f63a","11","111","333","11b"],"confidence":100,"text":"Clean sheets"}],"hotelType":{"text":"Very good wellness hotel."},"location":{"text":"Located near shopping areas with easy access to parking."},"locationNearby":null,"popularWith":{"text":"Popular among solo travelers.","tripType":"solo"},"popularity":37,"reviewsDistribution":[{"reviewsCount":22,"stars":1},{"reviewsCount":26,"stars":2},{"reviewsCount":113,"stars":3},{"reviewsCount":464,"stars":4},{"reviewsCount":617,"stars":5}],"score":"85","scoreDescription":"Very Good","summarySentenceList":[],"text":"Very good wellness hotel. Located near shopping areas with easy access to parking."}}},"packages":[{"propertyCode":"fqeA","description":"studio deluxe","supplierDescription":"studio deluxe","foodCode":1,"roomType":"studio deluxe","roomView":"","beds":{},"nonRefundable":false,"token":null,"images":[],"rateType":"pay_at_hotel","pricingVer":"178","initialForex":83.79976293615354,"displayRate":{"value":15084,"currency":"JPY","txFees":0,"txFeesInPct":0,"taxesAndFeesTotal":1508.4,"taxesConfident":0},"adjustedDisplayRate":{"value":15084,"currency":"JPY","txFees":0,"txFeesInPct":0,"taxesAndFeesTotal":1508.4,"taxesConfident":0},"marketRates":[],"unitMarketRates":[],"score":0,"skip":false,"finalAdjustmentAmount":null,"finalAdjustments":[],"totalAmount":null,"rakutenPoint":301,"payAtHotel":true}],"supplierId":null,"payAtHotel":true,"supplierRank":4}
```

