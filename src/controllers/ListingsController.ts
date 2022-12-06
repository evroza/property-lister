import { Router, Response, NextFunction, Request } from 'express';
import { Op } from 'sequelize';
import Controller from '@interfaces/Controller';
import EntityNotFoundException from '@exceptions/EntityNotFoundException';
import { sequelize } from '@models/model';
import ActionForbiddenException from '@exceptions/ActionForbiddenException';
import ServerException from '@exceptions/ServerErrorException';
import ListingExpression from '@models/ListingExpression';


class ListingsController implements Controller {
  public path = '/listings';
  public router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}`, this.getAllActiveListings);
    this.router.get(`${this.path}/:id`, this.getListingById);
    this.router.delete(`${this.path}/:id`, this.deleteListingById);
    this.router.put(`${this.path}/:id`, this.restoreListingById);
  }

  /**
   * getListingById fetches listing belonging with specified id - Includes it's non-deleted expressions
   * If listing has been deleted cannot be returned
   * @param request express request 
   * @param response express response
   * @param next 
   */
  private async getListingById (request: Request, response: Response, next: NextFunction) {
    const {Listing, ListingExpression} = request.app.get('models')
    const {id} = request.params
    const listing = await Listing.findOne({
      where: {
        [Op.and]: {
            id,
            isDeleted: {
              [Op.not]: 1
            }
        }
      },
      include: [{
        model: ListingExpression,
        required: true,
        as: "Expressions",
        where: {
          isDeleted: {
            [Op.not]: 1
          }
        }
    }],
  })
    if(!listing)  return next(new EntityNotFoundException("Listing", id));
    return response.json(listing)
  }

   /**
   * deleteListingById deletes listing belonging with specified id
   * If listing has already been deleted cannot be deleted, return error
   * @param request express request 
   * @param response express response
   * @param next 
   */
     private async deleteListingById (request: Request, response: Response, next: NextFunction) {
      const {Listing} = request.app.get('models');
      const {id} = request.params;
      const deleteListingResponse = {
        success: false
      }
      
      try {
        await sequelize.transaction(async (t) => {
          const listing = await Listing.findOne({where: {
              [Op.and]: {
                  id
              }
          }})
          if(!listing) {
            await t.rollback();
            return next(new EntityNotFoundException("Listing", id));
          } 
  
          if (listing.isDeleted == '1' ) {
            await t.rollback();
            return next(new ActionForbiddenException("Listing already deleted!"));
          }
  
          listing.isDeleted = '1';
          await listing.save();
          deleteListingResponse.success = true;
        });
  
        
        if(!response.headersSent) return response.json(deleteListingResponse)
      } catch (error) {
        // Transaction failed already rolled back
        return next(new ServerException(error));
      }
      
    }

    /**
   * restoreListingById restores listing belonging with specified id -sets isDeleted=0
   * Also sets default expression's isDeleted=0 if was also deleted
   * If listing has not been deleted cannot be restored, return error
   * @param request express request 
   * @param response express response
   * @param next 
   */
     private async restoreListingById (request: Request, response: Response, next: NextFunction) {
      const {Listing} = request.app.get('models');
      const {id} = request.params;
      const restoreListingResponse = {
        success: false
      }
      
      try {
        await sequelize.transaction(async (t) => {
          const listing = await Listing.findOne({where: {
              [Op.and]: {
                  id
              }
          }})
          if(!listing)  {
            await t.rollback();
            return next(new EntityNotFoundException("Listing", id));
          }
  
          if (listing.isDeleted == null || listing.isDeleted == '0') {
            await t.rollback();
            return next(new ActionForbiddenException("Listing is already active!"));
          }
  
          listing.isDeleted = '0';
          await listing.save();
          restoreListingResponse.success = true;
        });
  
        
        if(!response.headersSent) return response.json(restoreListingResponse)
      } catch (error) {
        // Transaction failed already rolled back
        return next(new ServerException(error));
      }
      
    }

  /**
   * getAllActiveListings returns all active Listings - excludes (soft)deleted listings
   * includes the default expression for each listing
   * @param request express request
   * @param response express response
   * @param next 
   * @returns 
   */
  public async getAllActiveListings (request: Request, response: Response, next: NextFunction) {
    const {Listing} = request.app.get('models');
    const listings = await Listing.findAll({
      where: {
        [Op.and]: {
            isDeleted: {
                [Op.not]: '1'
            }
        }
      },
      include: [{
        model: ListingExpression,
        required: true,
        as: "ActiveExpression"
    }]
    })
    if(listings.length == 0) return next(new EntityNotFoundException("Listing"));
    return response.json(listings)
  }
}

export default ListingsController;