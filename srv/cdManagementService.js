const { executeHttpRequest } = require('@sap-cloud-sdk/core');
cds.env.odata.protectMetadata = false
const sendMail = require('./libs/sendMail.js')

module.exports = (srv) => {
    const { withdrawalCD, transportreq } = srv.entities;

    srv.after('READ', 'withdrawalCD', (result, req) => {
        console.log('[AFTER READ]')

        is_developer = req.user.is("developer");
        is_baa = req.user.is("baa");

        if (Array.isArray(result)) {
            for (let i of result.entries()) {

                if (!is_developer) {
                    console.log("Setting dev options hidden for CD:", i[1].cdid);
                    i[1].assignDevEnabled = false;
                    i[1].updateWorkEnabled = false;
                }

                if (!is_baa) {
                    console.log("Setting cust option hidden for CD:", i[1].cdid);
                    i[1].assignBaaEnabled = false;
                    i[1].updateCustEnabled = false;
                }
            }
        } else {

            if (!is_developer) {
                console.log("Setting dev options hidden for CD:", result.cdid);
                result.assignDevEnabled = true;
                result.updateWorkEnabled = true;
            }

            if (!is_baa) {
                console.log("Setting cust option hidden for CD:", result.cdid);
                result.assignBaaEnabled = true;
                result.updateCustEnabled = true;
            }
        }
        console.log(result)
    })

    srv.on('assignBAA', async (req) => {
        const selectedCD = req.params[0].cdid;
        let selectcdquery = SELECT.from(withdrawalCD).columns("baa").where({ cdid: selectedCD });
        selectresult = await cds.run(selectcdquery);

        if (selectresult) {
            if (selectresult.baa == req.data.newBaa) {
                //do nothing
            } else {
                let updatequery = UPDATE(withdrawalCD, { cdid: selectedCD }).set({ baa: req.data.newBaa, baaEmail: req.data.newEmail });
                await cds.run(updatequery);
                req.info(`Update CD ${selectedCD} completed, please refresh to view the updated data`);
            }
        }
        await sendMail("baa", selectedCD, req.data.newEmail);
    })

    srv.on('assignDev', async (req) => {
        const selectedCD = req.params[0].cdid;
        let selectcdquery = SELECT.from(withdrawalCD).columns("developer").where({ cdid: selectedCD });
        selectresult = await cds.run(selectcdquery);

        if (selectresult) {
            if (selectresult.developer == req.data.newDev) {
                //do nothing
            } else {
                let updatequery = UPDATE(withdrawalCD, { cdid: selectedCD }).set({ developer: req.data.newDev, devEmail: req.data.newEmail });
                await cds.run(updatequery);
                req.info(`Update CD ${selectedCD} completed, please refresh to view the updated data`);
            }
        }
        await sendMail("dev", selectedCD, req.data.newEmail);
    })

    srv.on('updateCustStatus', async (req) => {
        const selectedCD = req.params[0].cdid;
        const completeStatus = "Completed"
        const overallStatus = "InProgress";

        let selectcdquery = SELECT.from(withdrawalCD).columns("workStatus", "gcmEmail").where({ cdid: selectedCD });
        selectresult = await cds.run(selectcdquery);

        if (selectresult.workStatus == "Completed") {
            overallstatus = "Completed"
        }
        let updatequery = UPDATE(withdrawalCD, { cdid: selectedCD }).set({ custStatus: completeStatus, overallStatus: overallStatus });
        await cds.run(updatequery);
        req.info(`Update CD ${selectedCD} completed, please refresh to view the updated data`);

        if ((overallStatus == "Completed") & selectresult[0].gcmEmail != "") {
            await sendMail("gcm", selectedCD, gcmEmail);
        }

    })

    srv.on('updateWorkStatus', async (req) => {
        const selectedCD = req.params[0].cdid;
        const completeStatus = "Completed"
        const overallStatus = "InProgress";

        let selectcdquery = SELECT.from(withdrawalCD).columns("custStatus", "gcmEmail").where({ cdid: selectedCD });
        selectresult = await cds.run(selectcdquery);

        if (selectresult.custStatus == "Completed") {
            overallstatus = "Completed"
        }
        let updatequery = UPDATE(withdrawalCD, { cdid: selectedCD }).set({ workStatus: completeStatus, overallStatus: overallStatus });
        await cds.run(updatequery);
        req.info(`Update CD ${selectedCD} completed, please refresh to view the updated data`);

        if ((overallStatus == "Completed") & selectresult[0].gcmEmail != "") {
            await sendMail("gcm", selectedCD, gcmEmail);
        }
    })

    srv.on('updateCDList', async (req) => {
        for (let cdEntry of req.data.inputcd.entries()) {
            console.log("Processing CD:", cdEntry[1].object_id);
            let baa, developer, gcm, baaEmail, devEmail, gcmEmail;

            //baa and developer to be updated later
            let inputCD = {
                cdid: cdEntry[1].object_id,
                cdDesc: cdEntry[1].description,
                overallStatus: "InProgress",
                custStatus: "InProgress",
                workStatus: "InProgress",
                baa: baa,
                developer: developer,
                baaEmail: baaEmail,
                devEmail: devEmail,
                gcm: gcm,
                gcmEmail: gcmEmail
            };

            let selectcdquery = SELECT.from(withdrawalCD).where({ cdid: inputCD.cdid })
            let selectcdresult = await cds.run(selectcdquery);


            //insert or  update CD
            let result;
            let action;
            if (selectcdresult.length === 0) {
                console.log("Inserting data");
                action = "Insert";
                let insertcdquery = INSERT.into(withdrawalCD).entries(inputCD);
                result = await cds.run(insertcdquery);


            } else {
                console.log("Updating data");
                action = "Update";
                let updatecdquery = UPDATE(withdrawalCD, { cdid: inputCD.cdid }).with(inputCD)
                result = await cds.run(updatecdquery);
            }

            //Process TR -> Insert or Update TR; Based on the statuses will update CD status as well

            //Default status to success, any TR in progress will set value to "InProgress"
            let overallStatus = custStatus = workStatus = "Completed";
            for (let trEntry of cdEntry[1].tr_links.entries()) {
                console.log("Processing TR:", trEntry[1].troder_number);
                if (trEntry[1].trfunction == 'K') {
                    baa = trEntry[1].resp_user;
                    baaEmail = trEntry[1].userEmail;
                    if (trEntry[1].status == "InProgress") {
                        overallStatus = custStatus = "InProgress";
                    }
                } else if (trEntry[1].trfunction == 'W') {
                    developer = trEntry[1].resp_user;
                    devEmail = trEntry[1].userEmail;
                    if (trEntry[1].status == "InProgress") {
                        overallStatus = workStatus = "InProgress";
                    }
                }

                let inputTR = {
                    parent_ID: "",
                    parent_cdid: "",
                    transportnum: trEntry[1].troder_number,
                    resp_user: trEntry[1].resp_user,
                    trfunction: trEntry[1].trfunction,
                    status: trEntry[1].status
                }

                let selecttrquery = SELECT.from(transportreq).columns("parent_id", "parent_cdid").where({ transportnum: inputTR.transportnum })
                let selecttrresult = await cds.run(selecttrquery);

                if (selecttrresult.length === 0) {
                    console.log("Inserting data");
                    inputTR.parent_ID = result.req.data.ID;
                    inputTR.parent_cdid = inputCD.cdid;
                    let inserttrquery = INSERT.into(transportreq).entries(inputTR);
                    await cds.run(inserttrquery);


                } else {
                    console.log("Updating data");
                    console.log(selecttrresult[0].parent_ID);
                    inputTR.parent_ID = selecttrresult[0].parent_ID;
                    inputTR.parent_cdid = inputCD.cdid;
                    let updatetrquery = UPDATE(transportreq, { transportnum: inputTR.transportnum }).with(inputTR)
                    await cds.run(updatetrquery);
                }
            }

            //update CD PIC + Status
            let updatepicquery = UPDATE(withdrawalCD, { cdid: inputCD.cdid }).set({
                baa: baa, developer: developer, baaEmail: baaEmail, devEmail: devEmail,
                overallStatus: overallStatus, custStatus: custStatus, workStatus: workStatus
            });
            await cds.run(updatepicquery);

            //send email ONLY if PICs are different
            let sendBaa, sendDev;

            console.log("Action is:", action)

            if (action == "Insert") {
                sendBaa = sendDev = true;
            } else if (action == "Update") {
                if ((baa != selectcdresult[0].baa) & (inputCD.baaEmail != "")) {
                    sendBaa = true;
                }
                if ((developer != selectcdresult[0].developer) & (inputCD.devEmail != "")) {
                    sendDev = true;
                }
            }

            if (sendBaa == true) {
                console.log("Sending email to BAA")
                await sendMail("baa", inputCD.cdid, baaEmail);

            }

            if (sendDev == true) {
                console.log("Sending email to developer")
                await sendMail("dev", inputCD.cdid, devEmail);
            }

        }
    })

    ////
}