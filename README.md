# Client code for PipTracker

https://pip-tracker.netlify.app/

Partial copy of the client code used for PipTracker.

I've removed unnecessary experimental models I was using and also removed tracking code.

This offers a few pages:

1) Landing page for interacting with images previously captured
2) "Capture" view with live camera
3) Edit/preview view which lets a user choose how they may want to change an images capture groups and whether to save or discard
4) A benchmark view for testing performance of new models
5) A "rules" view for users to see rules per game/amount of players

The code is very much incomplete but there were many things I learned in the process and I feel obligated to share with the community about how to use all of these things together.

The primary app uses a YOLOv5 model since that had the best performance/latency for use on mobile devices.

The export of the model is slightly different than their normal export. I noticed I was able to squeeze better performance out when I ran the NMS with supplied JS code in `YoloExperimentalV5Model` instead of using the one that was packaged in the default export, which is used in the `YoloObjectDetectionModel`.
