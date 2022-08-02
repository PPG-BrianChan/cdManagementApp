const { executeHttpRequest } = require('@sap-cloud-sdk/core');

module.exports = async function (mailfunction, cdid, recipient) {

    var baapayload = {
        "sender": "sapcoebtpgeneral@ppg.com",
        "recipient": recipient,
        "subject": `TESTING : CD ${cdid} to be withdrawn`,
        "type": "HTML",
        "body": `You have been assigned to reverse customizing changes implemented in CD ${cdid}.`
    }

    var devpayload = {
        "sender": "sapcoebtpgeneral@ppg.com",
        "recipient": recipient,
        "subject": `TESTING : CD ${cdid} to be withdrawn`,
        "type": "HTML",
        "body": `You have been assigned to reverse workbench changes implemented in CD ${cdid}.<br>https://google.com`
    }

    var gcmpayload = {
        "sender": "sapcoebtpgeneral@ppg.com",
        "recipient": recipient,
        "subject": `TESTING : CD ${cdid} ready for Withdrawal`,
        "type": "HTML",
        "body": `A notification that changes for CD ${cdid} have been completed reversed. The CD can now be withdrawn in SOLMAN.`
    }

    var baaValidatepayload = {
        "sender": "sapcoebtpgeneral@ppg.com",
        "recipient": recipient,
        "subject": `TESTING : CD ${cdid} : Change validation`,
        "type": "HTML",
        "body": `A workbench reversal is completed for CD ${cdid}. Kindly validate the changes in development system.`
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
        case "baaValidate":
            payload = baaValidatepayload;
            break;
    }

    try {
        console.log("Mail sending disabled for now");
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