import { NextFunction, Response, Request } from "express";

export default (err: any, _req: Request, res: Response, next: NextFunction) =>{

    if(!err) return next();
    let status = err.statusCode || 500;
    // res.status(status).send(failedResponse(err.message));

}
