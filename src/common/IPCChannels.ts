import {IPCToRenderer, IPCToMain} from "../lib/IPC"
import {TabletEvent} from "receive-tablet-event"
import PictureParams from "../renderer/models/PictureParams"

export const setTabletCaptureArea = new IPCToMain<{left: number, top: number, width: number, height: number}>("setTabletCaptureArea")
export const tabletDown = new IPCToRenderer<TabletEvent>("tabletDown")
export const tabletMove = new IPCToRenderer<TabletEvent>("tabletMove")
export const tabletUp = new IPCToRenderer<TabletEvent>("tabletUp")

export const newPictureDialogDone = new IPCToMain<PictureParams>("newPictureDialogDone")
