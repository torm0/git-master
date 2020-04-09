import GitMaster from '../core/GitMaster';
import { Plugin } from '../interfaces';

function maoToArray(mapData: Map<string, Plugin>) {
  const arr: any = [];

  mapData.forEach(function(value: string, key: any) {
    arr.push([key, value]);
  });

  return arr;
}

class LifecyclePlugins {
  static currentPlugin: string | null;

  static currentAdapterName: string | null;

  static currentAdapter: string | null;

  list: Map<string, Plugin>;

  pluginIdMap: Map<string, string[]>;

  name: string;

  ctx: GitMaster;

  constructor(name: string, ctx: GitMaster) {
    this.name = name;
    this.ctx = ctx;
    this.list = new Map();
    this.pluginIdMap = new Map();
  }

  register(id: string, plugin: Plugin): void {
    if (!id) throw new TypeError('id is required!');
    if (typeof plugin.handle !== 'function') throw new TypeError('plugin.handle must be a function!');

    if (this.list.has(id)) throw new TypeError(`${this.name} duplicate id: ${id}!`);

    this.list.set(id, plugin);

    this.registerLoadEvent(plugin);

    if (LifecyclePlugins.currentPlugin) {
      // maybe null
      if (this.pluginIdMap.has(LifecyclePlugins.currentPlugin)) {
        this.pluginIdMap.get(LifecyclePlugins.currentPlugin).push(id);
      } else {
        this.pluginIdMap.set(LifecyclePlugins.currentPlugin, [id]);
      }
    }
  }

  registerLoadEvent(plugin: any) {
    console.log(plugin.load);
    this.ctx.on('pjaxEnd', function(ctx) {
      plugin.handle(ctx);
    });
  }

  unregister(pluginName: string): void {
    if (this.pluginIdMap.has(pluginName)) {
      const pluginList = this.pluginIdMap.get(pluginName);
      pluginList.forEach((plugin: string) => {
        this.list.delete(plugin);
      });
    }
  }

  get(id: string): Plugin | undefined {
    return this.list.get(id);
  }

  getList(): Plugin[] {
    const filterMap: Map<string, Plugin> = new Map(
      maoToArray(this.list).filter(([k, v]) => {
        if (v.scope) {
          if (v.scope.length) {
            return v.scope.indexOf(LifecyclePlugins.currentAdapterName) >= 0;
          }
        }

        return true;
      }),
    );

    return Array.from(filterMap.values());
  }

  getIdList(): string[] {
    return Array.from(this.list.keys());
  }
}

export default LifecyclePlugins;
