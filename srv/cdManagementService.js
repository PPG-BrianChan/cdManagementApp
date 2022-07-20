cds.env.odata.protectMetadata = false
const sendMail = require('./libs/sendMail.js')

module.exports = (srv) => {
    const { withdrawalCD, transportreq, cdStatus } = srv.entities;

    srv.after('READ', 'withdrawalCD', (result, req) => {
        console.log("Event is: After READ")

        is_developer = req.user.is("developer");
        is_baa = req.user.is("baa");
        is_admin = req.user.is("admin");
        is_gcm = req.user.is("gcm");

        if (Array.isArray(result)) {
            for (let i of result.entries()) {

                if (!is_developer) {
                    i[1].assignDevEnabled = false;
                    i[1].updateWorkEnabled = false;
                }

                if (!is_baa) {
                    i[1].assignBaaEnabled = false;
                    i[1].updateCustEnabled = false;
                }
            }
        } else {

            if (!is_developer) {
                result.assignDevEnabled = false;
                result.updateWorkEnabled = false;
            }
            if (!is_baa) {
                result.assignBaaEnabled = false;
                result.updateCustEnabled = false;
            }
        }
    })

    srv.on('assignBAA', async (req) => {
        console.log("Event is: Assign BAA")
        const selectedCD = req.params[0].cdid;
        let selectcdquery = SELECT.from(withdrawalCD).columns("baa").where({ cdid: selectedCD });
        selectresult = await cds.run(selectcdquery);

        if (selectresult) {
            if (selectresult.baa == req.data.newBaa) {
                //do nothing
            } else {
                let updatequery = UPDATE(withdrawalCD, { cdid: selectedCD }).set({ baa: req.data.newBaa, baaEmail: req.data.newEmail });
                await cds.run(updatequery);
            }
        }
        await sendMail("baa", selectedCD, req.data.newEmail);
    })

    srv.on('assignDev', async (req) => {
        console.log("Event is: Assign Dev")
        const selectedCD = req.params[0].cdid;
        let selectcdquery = SELECT.from(withdrawalCD).columns("developer").where({ cdid: selectedCD });
        selectresult = await cds.run(selectcdquery);

        if (selectresult) {
            if (selectresult.developer == req.data.newDev) {
                //do nothing
            } else {
                let updatequery = UPDATE(withdrawalCD, { cdid: selectedCD }).set({ developer: req.data.newDev, devEmail: req.data.newEmail });
                await cds.run(updatequery);
            }
        }
        await sendMail("dev", selectedCD, req.data.newEmail);
    })

    srv.on('updateCustStatus', async (req) => {
        console.log("Event is: Update Cust Status")
        const newStatus = req.data.newStatus;
        const selectedCD = req.params[0].cdid;
        var overallStatus;

        let selectcdquery = SELECT.from(withdrawalCD).columns("workStatus", "gcmEmail").where({ cdid: selectedCD });
        selectresult = await cds.run(selectcdquery);

        if ((selectresult.workStatus == "Completed") & (newStatus == "Completed")) {
            overallStatus = "Completed"
        } else {
            overallStatus = "InProgress"
        }
        let updatequery = UPDATE(withdrawalCD, { cdid: selectedCD }).set({ custStatus: newStatus, overallStatus: overallStatus });
        await cds.run(updatequery);

        if ((overallStatus == "Completed") & selectresult[0].gcmEmail !== "") {
            await sendMail("gcm", selectedCD, selectresult[0].gcmEmail);
        }

    })

    srv.on('updateWorkStatus', async (req) => {
        console.log("Event is: Update Work Status")
        const newStatus = req.data.newStatus;
        const selectedCD = req.params[0].cdid;
        var overallStatus;

        let selectcdquery = SELECT.from(withdrawalCD).columns("custStatus", "gcmEmail", "baaEmail").where({ cdid: selectedCD });
        selectresult = await cds.run(selectcdquery);

        if ((selectresult.custStatus == "Completed") & (newStatus == "Completed")) {
            overallStatus = "Completed"
        } else {
            overallStatus = "InProgress"
        }
        let updatequery = UPDATE(withdrawalCD, { cdid: selectedCD }).set({ workStatus: newStatus, overallStatus: overallStatus });
        await cds.run(updatequery);

        if ((newStatus == "Completed") & (selectresult[0].baaEmail !== "")) {
            await sendMail("baaValidate", selectedCD, selectresult[0].baaEmail)
        }

        if ((overallStatus == "Completed") & selectresult[0].gcmEmail !== "") {
            await sendMail("gcm", selectedCD, selectresult[0].gcmEmail);
        }
    })

    srv.on('updateCDList', async (req) => {
        console.log("Event is: Update CD List")

        for (let cdEntry of req.data.inputcd.entries()) {
            console.log("Processing CD:", cdEntry[1].object_id);
            let baa, developer, baaEmail, devEmail;
            let overallStatus, workStatus, custStatus;

            //baa details & dev details & gcm details & statuses -> will be updated after processing TRs
            let inputCD = {
                cdid: cdEntry[1].object_id,
                cdDesc: cdEntry[1].description,
                overallStatus: "",
                custStatus: "",
                workStatus: "",
                baa: baa,
                developer: developer,
                baaEmail: baaEmail,
                devEmail: devEmail,
                gcm: cdEntry[1].gcm,
                gcmEmail: cdEntry[1].gcmEmail
            };

            let selectcdquery = SELECT.from(withdrawalCD).where({ cdid: inputCD.cdid })
            let selectcdresult = await cds.run(selectcdquery);


            //--------------------------Main Process 1-------------------------------------------------
            //insert or  update CD
            //--------------------------Main Process 1-------------------------------------------------
            let result;
            let action;
            if (selectcdresult.length === 0) {
                console.log("Inserting CD");
                action = "Insert";
                let insertcdquery = INSERT.into(withdrawalCD).entries(inputCD);
                result = await cds.run(insertcdquery);

                //Set default CD statuses
                overallStatus = workStatus = custStatus = "InProgress"
            } else {
                console.log("Updating CD");
                action = "Update";
                let updatecdquery = UPDATE(withdrawalCD, { cdid: inputCD.cdid }).with(inputCD)
                result = await cds.run(updatecdquery);

                //Get existing CD statuses
                console.log("Mapping old statuses")
                overallStatus = selectcdresult[0].overallStatus
                workStatus = selectcdresult[0].workStatus
                custStatus = selectcdresult[0].custStatus
                // console.log("Old values", overallStatus, workStatus, custStatus)
            }

            //--------------------------Main Process 2-------------------------------------------------
            //Process TR -> Insert or Update TR; Based on the statuses will update CD status as well
            //--------------------------Main Process 2-------------------------------------------------
            if (cdEntry[1].tr_links.length !== 0) {
                for (let trEntry of cdEntry[1].tr_links.entries()) {
                    console.log("Processing TR:", trEntry[1].trorder_number);
                    if (trEntry[1].trfunction == "W") {
                        baa = trEntry[1].resp_user;
                        baaEmail = trEntry[1].userEmail;
                    } else if (trEntry[1].trfunction == "K") {
                        developer = trEntry[1].resp_user;
                        devEmail = trEntry[1].userEmail;
                    }

                    let inputTR = {
                        parent_ID: "",
                        parent_cdid: "",
                        transportnum: trEntry[1].trorder_number,
                        resp_user: trEntry[1].resp_user,
                        trfunction: trEntry[1].trfunction,
                        status: trEntry[1].status
                    }

                    let selecttrquery = SELECT.from(transportreq).columns("parent_id", "parent_cdid", "status").where({ transportnum: inputTR.transportnum })
                    let selecttrresult = await cds.run(selecttrquery);

                    if (selecttrresult.length === 0) {
                        console.log("Inserting TR");
                        if (action == "Insert") {
                            inputTR.parent_ID = result.req.data.ID;
                        } else if (action == "Update") {
                            inputTR.parent_ID = selectcdresult[0].ID
                        }
                        inputTR.parent_cdid = inputCD.cdid;
                        let inserttrquery = INSERT.into(transportreq).entries(inputTR);
                        await cds.run(inserttrquery);

                        //For new TR insert -> ONLY applicable for CD updates
                        if (action == "Update") {
                            if (inputTR.trfunction == "W") {
                                custChanged = true;
                                if (inputTR.status == "Released") {
                                    custStatus = "Completed"
                                } else {
                                    custStatus = "InProgress"
                                    overallStatus = "InProgress"
                                }
                            } else if (inputTR.trfunction == "K") {
                                workChanged = true;
                                if (inputTR.status == "Released") {
                                    workStatus = "Completed";
                                } else {
                                    workStatus = "InProgress"
                                    overallStatus = "InProgress"
                                }
                            }
                        }
                    } else {
                        console.log("Updating TR");
                        inputTR.parent_ID = selecttrresult[0].parent_ID;
                        inputTR.parent_cdid = inputCD.cdid;
                        let updatetrquery = UPDATE(transportreq, { transportnum: inputTR.transportnum }).with(inputTR)
                        await cds.run(updatetrquery);

                        //For TR update -> If statuses changed from modifiable to released -> reversal completed -> update status at header
                        if ((selecttrresult[0].status !== inputTR.status) & (inputTR.status == "Released")) {
                            if (inputTR.trfunction == "W") {
                                custChanged = true;
                                custStatus = "Completed"
                            } else if (inputTR.trfunction == "K") {
                                workChanged = true;
                                workStatus = "Completed";
                            }
                        }
                    }
                }
            }

            //--------------------------Main Process 3-------------------------------------------------
            //Insert Chonological CD Statuses
            //--------------------------Main Process 3-------------------------------------------------
            if (cdEntry[1].chronoStatuses.length !== 0) {
                for (let csEntry of cdEntry[1].chronoStatuses.entries()) {
                    let inputCS = {
                        parent_ID: "",
                        parent_cdid: "",
                        date: csEntry[1].date,
                        time: csEntry[1].time,
                        status: csEntry[1].status,
                    }

                    if (action == "Insert") {
                        inputCS.parent_ID = result.req.data.ID;
                    }
                    else {
                        inputCS.parent_ID = selectcdresult[0].ID;
                    }
                    inputCS.parent_cdid = inputCD.cdid;

                    let insertcsquery = INSERT.into(cdStatus).entries(inputCS);
                    await cds.run(insertcsquery);
                }
            }


            //--------------------------Main Process 4-------------------------------------------------
            //Determine statuses
            //for new entries -> always in progress
            //for updates -> check if any status changes
            //--------------------------Main Process 4-------------------------------------------------
            if (action == "Insert") {
                overallStatus = workStatus = custStatus = "InProgress"
            } else {
                if ((workStatus == "Completed") & (custStatus == "Completed")) {
                    overallStatus = "Completed"
                }
            }

            //--------------------------Main Process 5-------------------------------------------------
            //update CD PIC + Status(only insert and status changed)
            //else update only PIC
            //--------------------------Main Process 5-------------------------------------------------
            let updatepicstatquery;
            // if ((action == "Insert") || (workChanged) || (custChanged)) {
            updatepicstatquery = UPDATE(withdrawalCD, { cdid: inputCD.cdid }).set({
                baa: baa, developer: developer, baaEmail: baaEmail, devEmail: devEmail,
                overallStatus: overallStatus, custStatus: custStatus, workStatus: workStatus
            });
            // } else {
            //     updatepicstatquery = UPDATE(withdrawalCD, { cdid: inputCD.cdid }).set({
            //         baa: baa, developer: developer, baaEmail: baaEmail, devEmail: devEmail
            //     });
            // }

            await cds.run(updatepicstatquery);

            //--------------------------Main Process 6-------------------------------------------------
            //send email ONLY if PICs are different
            //--------------------------Main Process 6-------------------------------------------------
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