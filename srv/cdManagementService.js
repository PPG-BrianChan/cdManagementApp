cds.env.odata.protectMetadata = false
const sendMail = require('./libs/sendMail.js')
const cdsapi = require('@sapmentors/cds-scp-api');
const sorty = require('sorty');
const userServiceAction_post = `/getUsers`
const devUsersURL = `/v1.0/groups/1dddc414-b7ab-45bb-97ca-866b471daf87/members`
const baaGroupIDs = ['02faedb6-8a7e-413b-b2fc-dffd9543e132', '1776573d-774d-4d69-978e-95edb9522abe', '1e868fd0-0eb4-4872-96bf-2b40d141406f', '40b5433a-f44c-4c6c-99c7-a12cd5b68248', 'e4067f89-2cae-4e28-bf8f-ff67e716536b']
const basicParams = `$select=mailNickname,displayName,mail&$count=true`

module.exports = (srv) => {
    const { withdrawalCD, transportreq, cdStatus } = srv.entities;

    function getUniqueListBy(arr, key) {
        return [...new Map(arr.map(item => [item[key], item])).values()]
    }

    srv.on('READ', 'baaUsers', async (req) => {
        console.log("Enter event read baaUsers");
        var destination = "User_List_Service_API";
        var graphQuery = '';

        if (req._queryOptions.$search !== undefined) {
            var search = req._queryOptions.$search;
            search = search.replace(/\*/g, '');
            var output = [search.slice(0, 1), 'displayName:', search.slice(1)].join('');
            graphQuery = `$search=${output}`
        }

        var userlist = [];
        var url = '';
        url = userServiceAction_post
        var count = 0;

        for (let baaGroupID of baaGroupIDs.entries()) {
            var baaUsersURL = `/v1.0/groups/${baaGroupID[1]}/members`
            var data = {
                "requrl": baaUsersURL,
                "reqparams": `${basicParams}&${graphQuery}`
            }
            const service = await cdsapi.connect.to(destination);
            try {
                const graphUser = await service.run({
                    url: url,
                    data: data,
                    method: "POST",
                })

                var tempuserlist = graphUser.value.value.map(graph_user => {
                    var user = {};
                    user.userid = graph_user.mailNickname;
                    user.fullname = graph_user.displayName;
                    user.email = graph_user.mail;
                    return user;
                });
                userlist = userlist.concat(tempuserlist);
            }
            catch (error) {
                if (error.response.data !== undefined) {
                    req.error({ "code": error.response.data.error.code, "message": error.response.data.error.message })
                } else {
                    req.error({ "message": error.message });
                }
            }
        }

        //Order by --> graph only supports orderby for fullname --> we will do the sort manually in js
        if (req.query.SELECT.orderBy) {
            var criteria = [];
            for (let orderBy of req.query.SELECT.orderBy.entries()) {
                if (orderBy[1].sort == 'asc') {
                    criteria.push({ name: `${orderBy[1].ref}`, dir: 'asc' })
                } else {
                    criteria.push({ name: `${orderBy[1].ref}`, dir: 'desc' })
                }
            }
        }
        sorty(criteria, userlist);

        //filter duplicates
        userlist = getUniqueListBy(userlist, 'fullname');

        //Get count
        count = userlist.length;
        Object.assign(userlist, { $count: count });
        return userlist;
    });

    srv.on('READ', 'devUsers', async (req) => {
        console.log("Enter event read devUsers");
        var destination = "User_List_Service_API";
        var graphQuery = '';
        console.log(req._queryOptions)

        if (req._queryOptions.$search !== undefined) {
            var search = req._queryOptions.$search;
            search = search.replace(/\*/g, '');
            var output = [search.slice(0, 1), 'displayName:', search.slice(1)].join('');
            graphQuery = `$search=${output}`
        }

        var userlist = {}
        var url = '';
        url = userServiceAction_post

        var data = {
            "requrl": devUsersURL,
            "reqparams": `${basicParams}&${graphQuery}`
        }

        console.log(data.reqparams);
        const service = await cdsapi.connect.to(destination);
        try {
            const graphUser = await service.run({
                url: url,
                data: data,
                method: "POST",
            })

            var count = 0;
            userlist = graphUser.value.value.map(graph_user => {
                var user = {};
                count++;
                user.userid = graph_user.mailNickname;
                user.fullname = graph_user.displayName;
                user.email = graph_user.mail;
                return user;
            });


            //Order by --> graph only supports orderby for fullname --> we will do the sort manually in js
            if (req.query.SELECT.orderBy) {
                var criteria = [];
                for (let orderBy of req.query.SELECT.orderBy.entries()) {
                    if (orderBy[1].sort == 'asc') {
                        criteria.push({ name: `${orderBy[1].ref}`, dir: 'asc' })
                    } else {
                        criteria.push({ name: `${orderBy[1].ref}`, dir: 'desc' })
                    }
                }
            }
            sorty(criteria, userlist);
            Object.assign(userlist, { $count: count });
        }
        catch (error) {
            req.error({ "code": error.response.data.error.code, "message": error.response.data.error.message })
        }
        return userlist;

    });

    srv.after('READ', 'withdrawalCD', (result, req) => {
        console.log("Event is: After READ CDs")

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
            let category = 'D';
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

                //Get existing CD statuses and category
                console.log("Mapping old statuses")
                overallStatus = selectcdresult[0].overallStatus
                workStatus = selectcdresult[0].workStatus
                custStatus = selectcdresult[0].custStatus
                category = selectcdresult[0].category_category
            }

            //--------------------------Main Process 2-------------------------------------------------
            //Process TR -> Insert or Update TR; Based on the statuses will update WORK/CUST status as well
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
            //Insert (C)honological CD (S)tatuses -> Will update Overall Status
            //--------------------------Main Process 3-------------------------------------------------
            let changeOverall = false;

            if (cdEntry[1].chronoStatuses.length !== 0) {
                //First sort cs entries by date
                var criteria = [];
                criteria.push({ name: `date`, dir: 'asc' });
                criteria.push({ name: `time`, dir: 'asc' });
                sorty(criteria, cdEntry[1].chronoStatuses);

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

                    //For insert (new CD) -> Determine category || For update (existing CD) -> Determine overall status
                    if (action == "Insert") {
                        if (inputCS.status == "To be tested") {
                            category = "Q";
                        } else if (inputCS.status == "Imported into Production") {
                            category = "P";
                        }
                        let insertcsquery = INSERT.into(cdStatus).entries(inputCS);
                        await cds.run(insertcsquery);
                    } else {
                        let selectcdstatquery = SELECT.from(cdStatus).columns("parent_id", "parent_cdid", "status").where({ parent_cdid: inputCS.parent_cdid, date: inputCS.date, time: inputCS.time, status: inputCS.status })
                        let selectcdstatresult = await cds.run(selectcdstatquery);

                        if (selectcdstatresult.length == 0) {
                            let insertcsquery = INSERT.into(cdStatus).entries(inputCS);
                            await cds.run(insertcsquery);

                            if (category == "Q" && inputCS.status == "Successfully Tested") {
                                changeOverall = true
                            } else if (category == "P" && inputCS.status == "Imported into Production") {
                                changeOverall = true
                            }
                        } else {
                            //do nothing
                        }
                    }
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
                    //Need to add check for CD status
                    if (changeOverall == true) {
                        overallStatus = "Completed"
                    }
                }
            }

            //--------------------------Main Process 5-------------------------------------------------
            //update CD PIC + Status(only insert and status changed)
            //else update only PIC
            //--------------------------Main Process 5-------------------------------------------------
            let updateheaderquery;
            // if ((action == "Insert") || (workChanged) || (custChanged)) {
                updateheaderquery = UPDATE(withdrawalCD, { cdid: inputCD.cdid }).set({
                catid_catid: category, baa: baa, developer: developer, baaEmail: baaEmail, devEmail: devEmail,
                overallStatus: overallStatus, custStatus: custStatus, workStatus: workStatus
            });
            // } else {
            //     updatepicstatquery = UPDATE(withdrawalCD, { cdid: inputCD.cdid }).set({
            //         baa: baa, developer: developer, baaEmail: baaEmail, devEmail: devEmail
            //     });
            // }

            let updateheaderresult = await cds.run(updateheaderquery);

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