const monitorsMap = new Map();

function createMonitor(req, res){
    try {
        const {id, timeout, alert_email} = req.body; 

        if(!id || !timeout || !alert_email) throw new Error("Missing details");
        if(typeof id !== 'string') throw new Error('Wrong format of data');
        if(typeof timeout !== 'number') throw new Error('Wrong format of data');
        if(typeof alert_email !== 'string') throw new Error('Wrong format of data');


        //convert the timeout to ms and add a grace period of 5s  due to poor network 
        const newTimeout = (timeout * 1000) + 500; 

        monitorsMap.set(id, {
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

module.exports = { createMonitor,  }