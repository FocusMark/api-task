const { v4: uuidv4 } = require('uuid');
const validate = require("validate.js");
const Status = require('./shared/status');
const Methodologies = require('./shared/methodologies');
const { FMErrors } = require('./shared/errors');

const MAX_TITLE_LENGTH = 100;
const MIN_TITLE_LENGTH = 3;

class Task {
    constructor(user, viewModel) {
        this.taskId = uuidv4();
        this.projectId = uuidv4();
        this.userId = user.userId;
        
        this.title = null;
        this.status = Status.PLANNING;
        
        this.targetDate = null;
        this.startDate = null;
        if (viewModel) {
            this.mapViewModel(viewModel);
        }
    }
    
    mapViewModel(viewModel) {
        for(const vmField in viewModel) {
            if (this[vmField] === undefined) {
                console.info(`Client sent the field ${vmField} which is not allowd on the model.`);
                throw FMErrors.JSON_INVALID_FIELDS;
            }
        }
        console.info(viewModel);
        for(const field in this) {
            if (field === 'taskid' || field === 'projectId' || field === 'userId' || field === 'createdAt' || field === 'updatedAt') {
                continue;
            }

            if (viewModel[field] !== undefined) {
                console.info(`Mapping field '${field}' to Task`);
                this[field] = viewModel[field];
            } else {
                console.info(`Client sent a request body with the ${field} field missing.`);
                throw FMErrors.JSON_MISSING_FIELDS;
            }
        }
    }
    
    validate() {
        this.validateTitle();
        this.validateStatus();
    }
    
    validateTitle() {
        if (this.title || this.title.length > MAX_TITLE_LENGTH || this.title.length < MIN_TITLE_LENGTH) {
            throw FMErrors.TITLE_VALIDATION_FAILED;
        }
    }
    
    validateStatus() {
        for(const item in Status) {
            if (this.status === Status[item]) {
                return;
            }
        }
        
        throw FMErrors.STATUS_VALIDATION_FAILED;
    }
}

module.exports = Task;