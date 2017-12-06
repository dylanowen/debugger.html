import {
  actions,
  selectors,
  createStore,
  makeSource
} from "../../../utils/test-head";
import { prefs } from "../../../utils/prefs";
const { getSource } = selectors;

describe("loadSourceText", async () => {
  // reset our preferences to test with source maps
  beforeEach(() => {
    prefs.clientSourceMapsEnabled = true;
  });

  it("loads two sources w/ one request", async () => {
    let resolve;
    let count = 0;
    const { dispatch, getState } = createStore({
      sourceContents: () =>
        new Promise(r => {
          count++;
          resolve = r;
        })
    });
    let source = makeSource("foo", { loadedState: "unloaded" });

    await dispatch(actions.newSource(source));

    source = getSource(getState(), source.id).toJS();
    dispatch(actions.loadSourceText(source));

    source = getSource(getState(), source.id).toJS();
    const loading = dispatch(actions.loadSourceText(source));

    resolve({ source: "yay", contentType: "text/javascript" });
    await loading;
    expect(count).toEqual(1);
    expect(getSource(getState(), source.id).toJS().text).toEqual("yay");
  });

  it("doesn't re-load loaded sources", async () => {
    let resolve;
    let count = 0;
    const { dispatch, getState } = createStore({
      sourceContents: () =>
        new Promise(r => {
          count++;
          resolve = r;
        })
    });
    let source = makeSource("foo", { loadedState: "unloaded" });

    await dispatch(actions.newSource(source));
    source = getSource(getState(), source.id).toJS();
    const loading = dispatch(actions.loadSourceText(source));
    resolve({ source: "yay", contentType: "text/javascript" });
    await loading;

    source = getSource(getState(), source.id).toJS();
    await dispatch(actions.loadSourceText(source));
    expect(count).toEqual(1);
    expect(getSource(getState(), source.id).toJS().text).toEqual("yay");
  });

  // This scenario happens when source maps are disabled
  it("loads sources when source maps are null", async () => {
    prefs.clientSourceMapsEnabled = false;

    const { dispatch, getState } = createStore(
      {
        sourceContents: () =>
          new Promise(r => {
            r({ source: "yay", contentType: "text/javascript" });
          })
      },
      {},
      null
    );
    let source = makeSource("foo", { loadedState: "unloaded" });

    await dispatch(actions.newSource(source));

    source = getSource(getState(), source.id).toJS();
    await dispatch(actions.loadSourceText(source));

    expect(getSource(getState(), source.id).toJS().text).toEqual("yay");
  });
});
