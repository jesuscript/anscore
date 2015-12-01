var DigitalOcean = require('do-wrapper'),
    async = require("async"),
    _ = require("lodash"),
    execSync = require("child_process").execSync,
    commandLineArgs = require("command-line-args");

var cli = commandLineArgs([
  { name: "mode", defaultOption: true, group: "control" },
  { name: "name", alias: "a", type: String, defaultValue: "cloud-shepard",
    description: "Name for the group of droplets to operate on (default: cloud_shepard)" },
  { name: "api-key", alias: "p", type: String, description: "DigitalOcean API key (required)" },
  { name: "ssh-key", alias: "s", type: String, group: "create",
    description: "Public ssh key file (required)"},
  { name: "number", alias: "n", type: Number, group: "create",
    description: "Number of nodes to create (default: 3)" },
  { name: "help", alias: "h", description: "Show usage"}
]);

try{
  var options = cli.parse();
}catch(e){
  improperUsage();
}

if(options._all.help) improperUsage();


var api = new DigitalOcean(options._none["api-key"] || improperUsage("No API key provided!"), 25);

({
  "create": function(){
    var sshKey = options.create["ssh-key"];
    
    if(!sshKey) improperUsage("Create: no ssh key provided");

    async.times(options.create.number, function(n, cb){
      api.dropletsCreate({
        name: options._all.name,
        region: "lon1",
        size: "512mb",
        "image": "ubuntu-15-10-x64",
        "ssh_keys": [
          execSync("ssh-keygen -E md5 -lf " + sshKey).toString().match(/MD5:([^\s]+)/)[1]
        ],
        "backups": false,
        "ipv6": false,
        "user_data": null,
        "private_networking": null
      },cb);
    }, function(err, ress){
      if(err) throw err;
      
      var report = fancyReporter();

      waitOperationEnd(function(body){
        var numDone = _.where(body.droplets, {status: "active"}).length;
        
        report("Creating " + options.create.number + " droplets", numDone, options.create.number);

        return (numDone === options.create.number);
      }, function(){
        getInventory(function(inventory){
          console.log(inventory);
        });
      });
      
    });

  },
  "destroy": function(){
    listDroplets(function(err, res, body){
      async.each(_.pluck(body.droplets, "id"), function(id, cb){
        api.dropletsDelete(id, cb);
      }, function(err){
        if(err) throw err;

        var report = fancyReporter(),
            total = body.droplets.length;

        waitOperationEnd(function(body){
          report("Destroying " + total + " droplets", body.droplets.length, total);
          
          return !body.droplets.length;
        });
      });
    });
  },
  "list": function(){
    listDroplets(function(err, res, body){ console.log(body); });
  },
  "inventory": function(){
    getInventory(function(inventory){
      if(inventory){
        console.log(inventory);
      }else{
        console.log("No droplets found");
      }
    });
  }
}[options.control.mode] || improperUsage)();

function getInventory(cb){
    listDroplets(function(err, res, body){
      if(body.droplets.length){
        var inv = "";
        
        inv = inv.concat("[node]\n")
          .concat(_.pluck(body.droplets,["networks","v4","0","ip_address"]).join("\n"));
        cb(inv);
      }else{
        cb();
      }
    });
}


function waitOperationEnd(isDone, cb){
  listDroplets(function(err, res, body){
    if(!isDone(body)){
      setTimeout(function(){waitOperationEnd(isDone,cb);}, 1500);
    }else{
      console.log("\nDone");

      if(cb) cb();
    }
  });
}

function listDroplets(cb){
  api.dropletsGetAll({
    name: options._all.name
  }, cb);
}

function fancyReporter(){
  return function(msg, current, total){
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(msg + "  [ " + _.repeat("▣",current) + _.repeat("_", total-current)
                         + " ]");
  };
}



function improperUsage(msg){
  if(msg) console.log("\033[31m\033[1m"+msg+"\033[0m\033[0m");
  
  console.log(cli.getUsage({
    title: "Cloud Shepard",
    description: "A very kind cloud control automation tool",
    synopsis: ["$ node digital_ocean.js create|destroy|list -p <api key> [args]"],
    groups: {
      _none: "",
      "create": "create"
      //"destroy": "destroy",
      //"list": "list",
    }
  }));
  process.exit();
};

