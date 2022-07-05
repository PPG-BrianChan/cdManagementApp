const { executeHttpRequest } = require('@sap-cloud-sdk/core');

module.exports = async function (mailfunction, cdid, recipient) {

    var baapayload = {
        "sender": "sapcoebtpgeneral@ppg.com",
        "recipient": recipient,
        "subject": `CD ${cdid} to be withdrawn`,
        "body": `You have been assigned to reverse customizing changes implemented in CD ${cdid}.`
    }

    var devpayload = {
        "sender": "sapcoebtpgeneral@ppg.com",
        "recipient": recipient,
        "subject": `CD ${cdid} to be withdrawn`,
        "body": `You have been assigned to reverse workbench changes implemented in CD ${cdid}.`
    }

    var gcmpayload = {
        "sender": "sapcoebtpgeneral@ppg.com",
        "recipient": recipient,
        "subject": `CD ${cdid} ready for Withdrawal`,
        "body": `A notification that changes for CD ${cdid} have been completed reversed. The CD can now be withdrawn in SOLMAN.`
    }

    var payload;

    console.log(mailfunction, typeof mailfunction)
    switch (mailfunction) {
        case "baa":
            payload = baapayload;
            break;
        case "dev":
            payload = devpayload;
            break;
        case "gcm":
            payload = gcmpayload;
            break;
    }

    try {
        await executeHttpRequest(
            {
                destinationName: "Mail_Service_API"
            },
            {
                method: 'POST',
                data: payload,
                url: "/mailrequests"
            }
        )
    }
    catch (error) {
        console.log("Error occured during mail sending, kindly check at mail service");
    }
}