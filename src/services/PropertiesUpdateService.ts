import fetch, { Response } from 'node-fetch';
import config from '@config/index';
import Job from '@models/Job';
import ProcessingJobStatus from '@interfaces/ProcessingJobStatus';
import crypto from 'crypto';
import Listing from '@models/Listing';
import { sequelize } from '@models/model';
import ListingExpression from '@models/ListingExpression';

const listingsEndpoint = config.get('listingsEndpoint');


export  default class PropertiesUpdateService {

    /**
     * update will fetch properties from Property Listings API 
     * and write to DB new Listings OR expressions if they don't exist
     */
    public async update(jobId: string) {
        try {
            let listings = await this.fetch();
            if (!listings) {
                await this.jobUpdate(jobId, {
                    result: "Nothing Returned from 3rd party endpoint!",
                    status: ProcessingJobStatus.Success
                })
                return;
            }

            await this.jobUpdate(jobId, { status: ProcessingJobStatus.UpdatingDb});
            //@ts-ignore
            console.log(`SUCCESS: Fetched ${listings.outlets.availability.results.length} properties from API!`);
            //@ts-ignore
            await this.createUpdateProperties(listings);
            await this.jobUpdate(jobId, { status: ProcessingJobStatus.Success});
        } catch (error) {
            await this.jobUpdate(jobId, {
                error,
                status: ProcessingJobStatus.Failed
            });
        }
    }

    private async jobUpdate(jobId: string, updateProps: any) {
        const JobModel = Job;
        await JobModel.update(
            updateProps
            , {
            where: {
                id: jobId
            }
        })
    }

    /**
     * fetch will get property listings from 3rd party API and return the result
     */
    public async fetch(): Promise<string> {
        let response: Response;
        const listingsPath = '/search/sgsg';
        const requestUrl = `${listingsEndpoint}${listingsPath}`;
        try {
            response = await fetch(requestUrl, {
                follow: 0,
                headers: {
                  'content-type': 'application/json'
                }
            })
            return await response.json() as string;
        } catch (error) {
            console.log('Some error!');
            throw error;
        }
    }

    /**
     * createUpdateProperties works through each property listing returned from API
     * and created new Listings if they don't already exist in DB OR create a new expression
     * for a Listing if the hash is different which would mean the property has been updated
     * Any new listings OR updates will be posted as a payload to the payload field of the Job
     * That way any poll for the job will return ONLY the updates which can be merged with the Data structure in frontend
     * can use this to create updates notification in frontend with the listings that have been updated
     * 
     * TODO: Can be optimized to avoid hitting DB too many times
     * 
     * @param properties JSON object with properties fetched from 3rd Party API
     * @returns JSON string with only updated properties OR null
     */
    public async createUpdateProperties(properties: propertyListings) {
        let listings = properties.outlets.availability.results;

        for (const listing of listings) {
            let propertyId = listing.property.propertyCode;
            let listingStr = JSON.stringify(listing);
            let hash = crypto.createHash('md5').update(listingStr).digest("hex");
            try {
                const dbListing = await Listing.findOne({
                    where: {
                        propertyId
                    }
                });

                if(!dbListing) {
                    //create listing and expression
                    await sequelize.transaction(async (t) => {
                        let newListing = await Listing.create({
                            propertyId,
                            hash
                        })
                        if(!newListing) {
                            await t.rollback();
                            throw new Error('Error creating listing: ' + propertyId);
                        };
                        
                        let expression = await ListingExpression.create({
                            listingId: newListing.id,
                            meta: listing,
                            isDeleted: 0,
                            isEdit: 0
                        });
                        if(!expression) {
                            await t.rollback();
                            throw new Error('Error creating Expression for Listing: ' + propertyId);
                        };
                        await newListing.set({ activeExpression: expression.id });
                        await newListing.save();
                    });
                    continue;
                }

                if(dbListing && dbListing.hash === hash) continue; // Listing up to date

                // Create new expression for Current listing and update hash
                await sequelize.transaction(async (t) => {
                    let expression = await ListingExpression.create({
                        listingId: dbListing.id,
                        meta: listing,
                        isDeleted: 0,
                        isEdit: 0
                    });
                    if(!expression) {
                        await t.rollback();
                        throw new Error('Error creating Expression for Listing: ' + propertyId);
                    };
                    dbListing.set({
                        hash
                    });
                    dbListing.save();
                });
            } catch (error) { console.log(error);
            
                console.log(`Error updating Listing or Expression for propertyId: ${propertyId}  PAYLOAD: ${listingStr}`);
            }
            
        }        
    }
}