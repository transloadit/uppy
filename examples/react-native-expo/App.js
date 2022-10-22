// import * as Expo from 'expo'
import React, { useEffect, useRef, useState } from "react";
import { Text, View, AsyncStorage, Image } from "react-native";
import Uppy from "@uppy/core";
import Tus from "@uppy/tus";
import UppyFilePicker from "@uppy/react-native";
import FileList from "./FileList";
import PauseResumeButton from "./PauseResumeButton";
import ProgressBar from "./ProgressBar";
import SelectFiles from "./SelectFilesButton";
import getTusFileReader from "./tusFileReader";

export default function App() {
  const [state, _setState] = useState({
    progress: 0,
    total: 0,
    file: null,
    uploadURL: null,
    isFilePickerVisible: false,
    isPaused: false,
    uploadStarted: false,
    uploadComplete: false,
    info: null,
    totalProgress: 0,
  });

  const setState = (newState) =>
    _setState((oldState) => ({ ...oldState, ...newState }));

  const uppy = useRef();

  useEffect(() => {
    uppy.current = new Uppy({ autoProceed: true, debug: true });
    uppy.current.use(Tus, {
      endpoint: "https://tusd.tusdemo.net/files/",
      urlStorage: AsyncStorage,
      fileReader: getTusFileReader,
      chunkSize: 10 * 1024 * 1024, // keep the chunk size small to avoid memory exhaustion
    });
    uppy.current.on("upload-progress", (file, progress) => {
      setState({
        progress: progress.bytesUploaded,
        total: progress.bytesTotal,
        totalProgress: uppy.current.state.totalProgress,
        uploadStarted: true,
      });
    });
    uppy.current.on("upload-success", () => {
      // console.log(file.name, response)
    });
    uppy.current.on("complete", (result) => {
      setState({
        status: "Upload complete ✅",
        uploadURL: result.successful[0] ? result.successful[0].uploadURL : null,
        uploadComplete: true,
        uploadStarted: false,
      });
      console.log("Upload complete:", result);
    });

    uppy.current.on("info-visible", () => {
      const { info } = uppy.current.getState();
      setState({
        info,
      });
      console.log("uppy-info:", info);
    });

    uppy.current.on("info-hidden", () => {
      setState({
        info: null,
      });
    });
  }, [setState]);

  const showFilePicker = () => {
    setState({
      isFilePickerVisible: true,
      uploadStarted: false,
      uploadComplete: false,
    });
  };

  const hideFilePicker = () => {
    setState({
      isFilePickerVisible: false,
    });
  };

  const togglePauseResume = () => {
    if (state.isPaused) {
      uppy?.current.resumeAll();
      setState({
        isPaused: false,
      });
    } else {
      uppy?.current.pauseAll();
      setState({
        isPaused: true,
      });
    }
  };

  return (
    <View
      style={{
        paddingTop: 100,
        paddingLeft: 50,
        paddingRight: 50,
        flex: 1,
      }}
    >
      <Text
        style={{
          fontSize: 25,
          marginBottom: 20,
          textAlign: "center",
        }}
      >
        Uppy in React Native
      </Text>
      <View style={{ alignItems: "center" }}>
        <Image
          style={{ width: 80, height: 78, marginBottom: 50 }}
          source={require("./assets/uppy-logo.png")}
        />
      </View>
      <SelectFiles showFilePicker={showFilePicker} />

      {state.info ? (
        <Text
          style={{
            marginBottom: 10,
            marginTop: 10,
            color: "#b8006b",
          }}
        >
          {state.info.message}
        </Text>
      ) : null}

      <ProgressBar progress={state.totalProgress} />

      <PauseResumeButton
        isPaused={state.isPaused}
        onPress={togglePauseResume}
        uploadStarted={state.uploadStarted}
        uploadComplete={state.uploadComplete}
      />

      {uppy?.current && (
        <UppyFilePicker
          uppy={uppy?.current}
          show={state.isFilePickerVisible}
          onRequestClose={hideFilePicker}
          companionUrl="http://localhost:3020"
        />
      )}

      {uppy?.current && <FileList uppy={uppy.current} />}

      {/* <Text>{state.status ? 'Status: ' + state.status : null}</Text>
      <Text>{state.progress} of {state.total}</Text> */}
    </View>
  );
}
