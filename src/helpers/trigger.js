const db = require('../db/db')
function trigger(id){
    const monitor = db.get(id);
    if(!monitor) return; 
    if(monitor.status == "PAUSED") return; 

    monitor.status = "DOWN";

    console.log({ ALERT: `Device ${id} is down!`, time: new Date().toISOString() })
}

module.exports = trigger;