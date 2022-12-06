import { Router, Response, NextFunction, Request } from 'express';
import Controller from '@interfaces/Controller';
import EntityNotFoundException from '@exceptions/EntityNotFoundException';
// import ListingsController from './ListingsController';
import PropertiesUpdateService from '@services/PropertiesUpdateService';
import { Op } from 'sequelize';
import ServerException from '@exceptions/ServerErrorException';


class UpdateController implements Controller {
  public path = '/updates';
  public router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}`, this.refreshProperties);
    this.router.get(`${this.path}/:jobId`, this.fetchUpdates);
  }

  /**
   * refreshProperties initiates an update check from 3rd party API
   * If have Update in process that hasn't failed, and was triggered less than 5 minutes ago
   * return that ID don't create new update check
   * If update job too old then might have silently failed create new update check
   * @param request express request 
   * @param response express response
   * @param next 
   */
  private async refreshProperties (request: Request, response: Response, next: NextFunction) {
    const {Job} = request.app.get('models');
    let job = await Job.findOne({where: {
        [Op.and]: {
            status: { [Op.notIn]: [-1,2] },
            createdAt: { [Op.lte]: 5 } // Find right expression for created at less than 5 minutes ago
        }
    }})
    if(job) return job;

    job = await Job.create({
      status: 0
    })
    if(!job)  return next(new ServerException("Unexpected error! Unable to Create Update Job"));
    new PropertiesUpdateService().update(job.id); //Trigger Properties Update - don't wait
    return response.json(job)
  }

  /**
   * fetchUpdate checks the status of a update check job
   * If done then fetch all listings, otherwise return it's status
   * @param request express request 
   * @param response express response
   * @param next 
   */
   private async fetchUpdates (request: Request, response: Response, next: NextFunction) {
    const {Job} = request.app.get('models');
    const {jobId} = request.params
    let job = await Job.findOne({
      id: jobId
    })

    if(!job)  return next(new EntityNotFoundException("Job", job.id));
    if (job.status !== 2) return response.json(job);

    // Fetch Properties Listings if Job completed
    // return await new ListingsController().getAllActiveListings(request, response, next);
  }
}

export default UpdateController;