#! /usr/bin/env node

const dicomp10todicomweb = require('./../src/index')
const {getArg,hasArg, getRemainingArgs, showHelp} = require('./../src/args');
const path = require('path');
const { JSONWriter } = require('./../src/index');
const dicomwebDefaultDir = path.join(require('os').homedir(), 'dicomweb');

const {JSONReader, IdCreator, HashDataWriter, CompleteStudyWriter, DeduplicateWriter, InstanceDeduplicate, ImageFrameWriter, processFiles } = dicomp10todicomweb;


const main = async () => {
    const directoryName = getArg('-d', '--directory', dicomwebDefaultDir, 'Set output directory (~/dicomweb)')
    const isDeduplicate = hasArg('-e', '--deduplicate', false, 'Write deduplicate instance level data')
    const isStudyData = hasArg('-s', '--study', false, 'Write study metadata - on provided instances only')
    const isGroup = isStudyData || hasArg('-g', '--group', false, 'Write combined deduplicate data')
    const isInstanceMetadata = hasArg('-i', '--instances', !(isGroup || isDeduplicate), 'Write instance metadata')
    const isClean = hasArg(null,'--clean',true,'Clean the study output directory for these instances')
    const maximumInlinePublicLength = getArg('-m', '--maximumInlinePublicLength', 128*1024+2, 'Maximum length of public binary data')
    const maximumInlinePrivateLength = getArg(null, '--maximumInlinePrivateLength', 64, 'Maximum length of private binary data')
    const colourContentType = getArg(null, '--colourContentType', null, 'Colour content type')
    const contentType = getArg('-c', '--contentType', null, 'Content type')
    const recompressType = getArg(null, '--recompress', 'uncompressed,j2k,j2p', 'List of types to recompress')

    const isHelp = hasArg('-h', '--help',false, 'Print help');

    const files = getRemainingArgs();
    if(!files.length || isHelp) {
        showHelp( 
            'mkdicomwebinstances (options) <inputfiles>',
            'Make DICOMweb instances from binary Part 10 DICOM files.');
        return
    }
    
    const options = {
        maximumInlinePublicLength, maximumInlinePrivateLength,
        isGroup, isInstanceMetadata, isDeduplicate, isClean,
        isStudyData,
        recompressType, contentType, colourContentType,
        directoryName,
    }

    const callback = {
        uids: IdCreator(options),
        bulkdata: HashDataWriter(options),
        imageFrame: ImageFrameWriter(options),
        completeStudy: CompleteStudyWriter(options),
        metadata: InstanceDeduplicate(options),
        deduplicated: DeduplicateWriter(options),
    }

    await processFiles(files, callback, options);
    await callback.completeStudy();
}

main().then(()=> {
        console.log('done')
    });
