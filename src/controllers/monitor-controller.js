const db = require('../db/db');
const trigger = require('../helpers/trigger')

function createMonitor(req, res){
    try {
        const {id, timeout, alert_email} = req.body; 

        if(!id || !timeout || !alert_email) throw new Error("Missing details");
        if(typeof id !== 'string') throw new Error('Wrong format of data');
        if(typeof timeout !== 'number') throw new Error('Wrong format of data');
        if(typeof alert_email !== 'string') throw new Error('Wrong format of data');


        //convert the timeout to ms and add a grace period of 5s  due to poor network 
        const newTimeout = (timeout * 1000) + 5000; 

        db.set(id, {
            id: `${id}`,
            status: "ACTIVE",
            timeout: newTimeout,
            alert_email: alert_email,
            timeRef: setTimeout(() => trigger(id), newTimeout),
            createdAt: new Date(),
            lastUpdated: new Date()
        });


        return res.status(201).json({message: "Monitor created successfully"})

    } catch (error) {
        return res.status(400).json({message: error.message});
    }
}

function resetTimer(req, res){
   try {
     const { id } = req.params; 
    
    //check for the existence of the id
    const monitor = db.get(id);
    if(!monitor) throw new Error("Monitor not found");

    //check if the monitor has expired
    if(monitor.status === "DOWN") {
        return res.status(200).json({message: "Timer has expired"});
    }
    //reset the timer 
    const newTimeout = monitor.timeout; 
    clearTimeout(monitor.timeRef);
    monitor.timeRef = setTimeout(() => trigger(id), newTimeout);
    monitor.lastUpdated = new Date();
    db.set(id, monitor);
    return res.status(200).json({message: "Timer has been reset successfully"})

   } catch (error) {
    return res.status(404).json({message: error.message}); 
   }
} 

function revertTimerState(req, res){
    try {
        const {id} = req.params; 
        //check whether the id exists 
        const monitor = db.get(id);
        if(!monitor) throw new Error("Monitor does not exist"); 
        if(monitor.status === "ACTIVE"){
            clearTimeout(monitor.timeRef);
            monitor.status = "PAUSED"; 
            monitor.lastUpdated = new Date();
            db.set(id, monitor); 
            return res.status(200).json({message: "Timer paused successfully"})
        }
        else if(monitor.status === "PAUSED"){
            clearTimeout(monitor.timeRef);
            monitor.status = "ACTIVE"; 
            monitor.timeRef = setTimeout(() => trigger(id), monitor.timeout);
            monitor.lastUpdated = new Date();
            db.set(id, monitor); 
            return res.status(200).json({message: "Timer unpaused successfully"})
        }else throw new Error("Timer has expired");

    } catch (error) {
        return res.status(400).json({message: error.message})
    }
}

function getAllMonitors(req, res){
    try {
        let allMonitors = [];
        for(let monitor of db.values()){
            let refinedMonitor = {
                id: monitor.id,
                status: monitor.status,
                createdAt: monitor.createdAt,
                lastUpdated: monitor.lastUpdated
            };
            allMonitors.push(refinedMonitor)
        }
        return res.status(200).json({data: allMonitors})
    } catch (error) {
        return res.status(400).json({message: error.message})
    }
}



module.exports = { createMonitor, resetTimer, revertTimerState, getAllMonitors  };