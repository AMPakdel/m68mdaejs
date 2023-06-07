const Model = require("../lib/Model");

class Error extends Model {

    static array_name = "errors";

    id = "";
    count = 0;
    last_sent_timestamp = 0;
}

module.exports = Error;