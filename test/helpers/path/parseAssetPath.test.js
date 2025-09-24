import PathMock from "path";
import parseAssetPath from "../../../src/shared/lib/assets/parseAssetPath";

jest.mock("path");
const PathActual = jest.requireActual("path");

test("Should parse posix asset paths", async () => {
  PathMock.relative = PathActual.posix.relative;
  PathMock.sep = PathActual.posix.sep;

  const projectRoot = "/home/test/projectname";
  const filename = "/home/test/projectname/assets/backgrounds/testing.png";
  const assetFolder = "backgrounds";

  const { relativePath, plugin, file } = parseAssetPath(
    filename,
    projectRoot,
    assetFolder,
  );

  expect(plugin).toBe(undefined);
  expect(relativePath).toBe("assets/backgrounds/testing.png");
  expect(file).toBe("testing.png");

  PathMock.relative = PathActual.relative;
  PathMock.sep = PathActual.sep;
});

test("Should parse win32 asset paths", async () => {
  PathMock.relative = PathActual.win32.relative;
  PathMock.sep = PathActual.win32.sep;

  const projectRoot = "C:\\home\\test\\projectname";
  const filename =
    "C:\\home\\test\\projectname\\assets\\backgrounds\\testing.png";
  const assetFolder = "backgrounds";

  const { relativePath, plugin, file } = parseAssetPath(
    filename,
    projectRoot,
    assetFolder,
  );

  expect(plugin).toBe(undefined);
  expect(relativePath).toBe("assets\\backgrounds\\testing.png");
  expect(file).toBe("testing.png");

  PathMock.relative = PathActual.relative;
  PathMock.sep = PathActual.sep;
});

test("Should parse posix plugin paths", async () => {
  PathMock.relative = PathActual.posix.relative;
  PathMock.sep = PathActual.posix.sep;

  const projectRoot = "/home/test/projectname";
  const filename =
    "/home/test/projectname/plugins/myplugin/backgrounds/testing.png";
  const assetFolder = "backgrounds";

  const { relativePath, plugin, file } = parseAssetPath(
    filename,
    projectRoot,
    assetFolder,
  );

  expect(plugin).toBe("myplugin");
  expect(relativePath).toBe("plugins/myplugin/backgrounds/testing.png");
  expect(file).toBe("testing.png");

  PathMock.relative = PathActual.relative;
  PathMock.sep = PathActual.sep;
});

test("Should parse win32 plugin paths", async () => {
  PathMock.relative = PathActual.win32.relative;
  PathMock.sep = PathActual.win32.sep;

  const projectRoot = "C:\\home\\test\\projectname";
  const filename =
    "C:\\home\\test\\projectname\\plugins\\myplugin\\backgrounds\\testing.png";
  const assetFolder = "backgrounds";

  const { relativePath, plugin, file } = parseAssetPath(
    filename,
    projectRoot,
    assetFolder,
  );

  expect(plugin).toBe("myplugin");
  expect(relativePath).toBe("plugins\\myplugin\\backgrounds\\testing.png");
  expect(file).toBe("testing.png");

  PathMock.relative = PathActual.relative;
  PathMock.sep = PathActual.sep;
});

test("Should parse posix nested plugin paths", async () => {
  PathMock.relative = PathActual.posix.relative;
  PathMock.sep = PathActual.posix.sep;

  const projectRoot = "/home/test/projectname";
  const filename =
    "/home/test/projectname/plugins/core/myplugin/backgrounds/testing.png";
  const assetFolder = "backgrounds";

  const { relativePath, plugin, file } = parseAssetPath(
    filename,
    projectRoot,
    assetFolder,
  );

  expect(plugin).toBe("core/myplugin");
  expect(relativePath).toBe("plugins/core/myplugin/backgrounds/testing.png");
  expect(file).toBe("testing.png");

  PathMock.relative = PathActual.relative;
  PathMock.sep = PathActual.sep;
});

test("Should parse win32 nested plugin paths", async () => {
  PathMock.relative = PathActual.win32.relative;
  PathMock.sep = PathActual.win32.sep;

  const projectRoot = "C:\\home\\test\\projectname";
  const filename =
    "C:\\home\\test\\projectname\\plugins\\core\\myplugin\\backgrounds\\testing.png";
  const assetFolder = "backgrounds";

  const { relativePath, plugin, file } = parseAssetPath(
    filename,
    projectRoot,
    assetFolder,
  );

  expect(plugin).toBe("core/myplugin");
  expect(relativePath).toBe(
    "plugins\\core\\myplugin\\backgrounds\\testing.png",
  );
  expect(file).toBe("testing.png");

  PathMock.relative = PathActual.relative;
  PathMock.sep = PathActual.sep;
});
