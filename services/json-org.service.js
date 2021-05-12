var fs = require('fs');


async function convertToObject(apiData) {
    let dataArray = []
    for (const key in apiData) {
        if (Object.hasOwnProperty.call(apiData, key)) {
            const element = apiData[key];
            dataArray = dataArray.concat(element)
        }
    }
    return dataArray
}


async function mapChildren(apiData) {
    var map = {}
    // Iterates the array to find the childrens
    for (var i = 0; i < apiData.length; i++) {
        var obj = apiData[i];
        map[obj.id] = obj;

        obj.children = []; // defaults children to empty

        var parent = obj.parent_id || '-'; //gets parent id or toplevel by default
        if (!map[parent]) {
            map[parent] = {
                children: []
            };
        }
        map[parent].children.push(obj);  // push to children
    }

    return map['-'].children;
}


const Organizer = async (fileName) => {
    var datafile = JSON.parse(fs.readFileSync(fileName, 'utf8'));
    const cleanedData = await convertToObject(datafile);
    const ans = await mapChildren(cleanedData)
    const outputFilepath = fileName.replace('uploads', 'outputs')
    fs.writeFileSync(outputFilepath, JSON.stringify(ans))
    return { filename: outputFilepath, data: ans }
}

exports.organise = Organizer
