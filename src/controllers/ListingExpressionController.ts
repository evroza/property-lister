import { Router, Response, NextFunction, Request } from 'express';
import { Op } from 'sequelize';
import Controller from '@interfaces/Controller';
import { sequelize } from '@models/model';
import ActionForbiddenException from '@exceptions/ActionForbiddenException';
import EntityNotFoundException from '@exceptions/EntityNotFoundException';
import ServerException from '@exceptions/ServerErrorException';
import Listing from '@models/Listing';


class ListingExpressionController implements Controller {
  public path = '/listings/:listingId/expressions';
  public router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}`, this.getAllListingExpressions);
    this.router.get(`${this.path}/:expressionId`, this.getListingExpressionById);
    this.router.delete(`${this.path}/:expressionId`, this.deleteListingExpressionById);
    this.router.put(`${this.path}/:expressionId`, this.restoreListingExpressionById); //restore expression
    this.router.post(`${this.path}/:expressionId`, this.editListingExpressionById); //edit listing (Will create new expression)
  }

  /**
   * getAllActiveListingExpressions returns all expressions for a Listing - INCLUDES (soft)deleted expressions
   * @param request express request
   * @param response express response
   * @param next 
   * @returns 
   */
   private async getAllListingExpressions (request: Request, response: Response, next: NextFunction) {
    const {ListingExpression} = request.app.get('models');
    const {listingId} = request.params;
    const expressions = await ListingExpression.findAll({where: {
        listingId
    }})
    if(expressions.length == 0) return next(new EntityNotFoundException("Expression"));
    return response.json(expressions)
  }

  /**
   * getListingExpressionById fetches expression of specified id belonging to particular listing
   * If Parent listing OR specifiedExpression has been deleted cannot be returned
   * @param request express request 
   * @param response express response
   * @param next 
   */
  private async getListingExpressionById (request: Request, response: Response, next: NextFunction) {
    const {ListingExpression} = request.app.get('models');
    const {listingId, expressionId} = request.params;
    const expression = await ListingExpression.findOne({where: {
        [Op.and]: {
            listingId,
            id: expressionId
        }
    }})
    if(!expression)  return next(new EntityNotFoundException("Expression", listingId));
    if(expression.isDeleted) return next(new ActionForbiddenException("Expression Deleted"));
    return response.json(expression)
  }

   /**
   * deleteListingExpressionById deletes expression of a listing given expression and listing Id
   * If listing OR specified expression has already been deleted cannot be deleted, return error
   * If all expressions of a Listing deleted, then also delete Listing
   * @param request express request 
   * @param response express response
   * @param next 
   */
  private async deleteListingExpressionById (request: Request, response: Response, next: NextFunction) {
      const {ListingExpression} = request.app.get('models');
      const {listingId, expressionId} = request.params;
      const expression = await ListingExpression.findOne({
        where: {
            [Op.and]: {
                listingId,
                id: expressionId
            } 
        },
        include: [{
          model: Listing,
          required: true,
          as: "Listing"
      }]
      });
      if(!expression)  return next(new EntityNotFoundException("Expression", listingId));
      if(expression.Listing.isDeleted == 1)  return next(new ActionForbiddenException("Expression's Parent Listing is Already Deleted!"));
      if(expression.Listing.activeExpression == expressionId)  return next(new ActionForbiddenException("Cannot delete default expression of Listing if other expressions exist. Switch expression first!"));
      if(expression.isDeleted) return next(new ActionForbiddenException("Expression Already Deleted!"));

      const deleteExpressionResponse = {
        success: false
      };
      
      try {
        // Delete expression
        // If last expression for listing also delete listing, otherwise rollback
        await sequelize.transaction(async (t) => {
          expression.isDeleted = '1';
          await expression.save();
          
          const nonDeletedExpressions = await ListingExpression.count({
            where: { 
              listingId: listingId,
              isDeleted: '0'
            },
          });
          if (nonDeletedExpressions > 0) {
            deleteExpressionResponse.success = true
            return;
          }
  
          await Listing.update({
              isDeleted: '1'
          }, {
              where: {
                  id: listingId
              }
          })
          deleteExpressionResponse.success = true;
        });
  
        
        if(!response.headersSent) return response.json(deleteExpressionResponse)
      } catch (error) {
        // Transaction failed already rolled back
        return next(new ServerException(error));
      }
      
    }

   /**
   * restoreListingExpressionById restores expression of the specified ID -sets isDeleted=0
   * NB!! If Listing had been deleted, restore it and set restored expression to default for that Listing
   * If expression has not been deleted cannot be restored, return error
   * @param request express request 
   * @param response express response
   * @param next 
   */
     private async restoreListingExpressionById (request: Request, response: Response, next: NextFunction) {
      const {ListingExpression} = request.app.get('models');
      const {listingId, expressionId} = request.params;
      const expression = await ListingExpression.findOne({
        where: {
            [Op.and]: {
                listingId,
                id: expressionId
            } 
        },
        include: [{
          model: Listing,
          required: true,
          as: "Listing"
      }]
      });
      if(!expression)  return next(new EntityNotFoundException("Expression", listingId));
      if(expression.isDeleted == 0) return next(new ActionForbiddenException("Expression is Live, cannot be restored!"));
      const restoreListingExpressionResponse = {
        success: false
      }
      
      try {
        await sequelize.transaction(async (t) => {
          expression.isDeleted = '0';
          await expression.save();
          if(expression.Listing.isDeleted == 0) {
            restoreListingExpressionResponse.success = true;
            return;
          }  
  
          await Listing.update({
              isDeleted: '0',
              activeExpression: expressionId
          }, {
              where: {
                  id: listingId
              }
          })
          restoreListingExpressionResponse.success = true;
        });
  
        
        if(!response.headersSent) return response.json(restoreListingExpressionResponse)
      } catch (error) {
        // Transaction failed already rolled back
        return next(new ServerException(error));
      }
      
    }

  /**
   * editListingExpressionById creates new expression based on a previous expression whose ID had been provided
   * NB!! Cannot edit deleted expression
   * If expression has not been deleted cannot be restored, return error
   * @param request express request 
   * @param response express response
   * @param next 
   */
      private async editListingExpressionById (request: Request, response: Response, next: NextFunction) {
        const {ListingExpression} = request.app.get('models');
        const {listingId, expressionId} = request.params;
        const meta = request.body;
        console.log(meta);
        
        const expression = await ListingExpression.findOne({
          where: {
              [Op.and]: {
                  listingId,
                  id: expressionId
              } 
          },
          include: [{
            model: Listing,
            required: true,
            as: "Listing"
        }]
        });
        if(!expression)  return next(new EntityNotFoundException("Expression", expressionId));
        if(expression.isDeleted == 1 || expression.Listing.isDeleted == 1) return next(new ActionForbiddenException("Expression or Parent Listing is Deleted, cannot edit!"));



        const createNewExpressionResponse = {
          success: false,
          expressionId: null
        }
        
        try {
          let newExpression = await ListingExpression.create({
            listingId,
            meta: meta.meta,
            isDeleted: 0,
            isEdit: 1,
            parentExpression: expressionId
          });
          createNewExpressionResponse.success = true;
          createNewExpressionResponse.expressionId = newExpression.id;
          
          if(!response.headersSent) return response.json(createNewExpressionResponse)
        } catch (error) {
          return next(new ServerException(error));
        }
        
      }

}

export default ListingExpressionController  ;