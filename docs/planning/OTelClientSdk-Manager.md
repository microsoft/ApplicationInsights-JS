# OTelClientSdk Manager Design

## Overview

The OTelClientSdk Manager is a core component that enables multiple SDK instances to coexist while efficiently sharing underlying resources. This design allows different teams or components within an application to create isolated SDK instances with their own configurations, instrumentations, and control planes, while minimizing the impact on runtime performance.

## Goals

1. Enable multiple isolated SDK instances within a single runtime
2. Efficiently share core resources (timers, connections, etc.)
3. Provide centralized telemetry batching and exporting
4. Maintain configuration isolation between instances
5. Support independent instrumentation management per instance
6. Enable telemetry filtering and processing per instance
7. Support versioning and side-by-side execution
8. Provide APIs for instance discovery and management

## Architecture

### SDK Manager Component

```typescript
/**
 * Interface for the OTelClientSdk Manager
 */
export interface IOTelClientSdkManager {
  /** Get the number of active SDK instances */
  getInstanceCount(): number;
  /** Get the list of active SDK instance names */
  getInstanceNames(): string[];
  /** Get an SDK instance by name */
  getInstance(name: string): IOTelClientSdk | undefined;
  /** Register a new SDK instance */
  registerInstance(instance: IOTelClientSdk): void;
  /** Unregister an SDK instance */
  unregisterInstance(instance: IOTelClientSdk): void;
  /** Shut down all SDK instances */
  shutdownAll(): Promise<void>;
  /** Unload all SDK instances */
  unloadAll(): Promise<void>;
  /** Get shared resources */
  getSharedResources(): ISharedResources;
}

/**
 * Interface for shared resources
 */
export interface ISharedResources {
  /** The timer pool */
  timerPool: ITimerPool;
  /** The export queue */
  exportQueue: IExportQueue;
  /** The connection manager */
  connectionManager: IConnectionManager;
  /** The resource pool */
  resourcePool: IResourcePool;
}
```

### Instance Registration Process

When a new SDK instance is created:

1. The instance registers with the SDK Manager
2. The SDK Manager assigns a unique instance ID
3. The instance receives access to shared resources
4. The instance maintains its own configuration, processors, and instrumentations
5. Telemetry collected by the instance is tagged with the instance ID
6. Shared exporters handle telemetry from all instances

### Shared Resource Management

The SDK Manager coordinates these shared resources:

1. **Timer Pool**: Manages timers to minimize timer creation
2. **Connection Manager**: Manages network connections for all instances
3. **Export Queue**: Batches and queues telemetry from all instances
4. **Resource Pool**: Manages reusable objects to reduce memory allocation

### Telemetry Flow

```
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│ Instance A  │   │ Instance B  │   │ Instance C  │
│ Telemetry   │   │ Telemetry   │   │ Telemetry   │
└──────┬──────┘   └──────┬──────┘   └──────┬──────┘
       │                 │                 │
       ▼                 ▼                 ▼
┌─────────────────────────────────────────────┐
│           Instance-specific Processing      │
│  (Filtering, Enrichment, Sampling, etc.)    │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│        SDK Manager Shared Export Queue       │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│             Shared Exporters                 │
│   (Batching, Throttling, Retry, etc.)        │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│          Backend Ingestion Endpoints         │
└──────────────────────────────────────────────┘
```

## Implementation Details

### SDK Manager Implementation

```typescript
/**
 * Get the default SDK Manager instance for the current module
 */
export function getOTelClientSdkManager(name?: string): IOTelClientSdkManager {
  if (!name) {
    if (!_defaultInstance) {
      _defaultInstance = createOTelClientSdkManager("default");
    }
    return _defaultInstance;
  }
  
  // Return existing manager by name or create a new one
  if (!_namedInstances[name]) {
    _namedInstances[name] = createOTelClientSdkManager(name);
  }
  return _namedInstances[name];
}

/**
 * Create a new SDK Manager
 * @param managerName - The name of this SDK Manager instance
 */
export function createOTelClientSdkManager(managerName: string): IOTelClientSdkManager {
  // Private closure variables
  const _managerName = managerName;
  const _instances: IOTelClientSdk[] = [];
  const _instanceMap: Record<string, IOTelClientSdk> = {};
  
  // Create shared resources
  const _timerPool = createTimerPool();
  const _exportQueue = createExportQueue();
  const _connectionManager = createConnectionManager();
  const _resourcePool = createResourcePool();
    // Create the instance with direct method implementations
  const _self: IOTelClientSdkManager = {
    // Get manager name
    get name() { return _managerName; },
    // Get instance count
    getInstanceCount() {
      return _instances.length;
    },
    
    // Get instance names
    getInstanceNames() {
      return _instances.map(instance => instance.name);
    },
    
    // Get instance by name
    getInstance(name: string) {
      return _instanceMap[name];
    },
    
    // Register instance
    registerInstance(instance: IOTelClientSdk) {
      if (instance.name && !_instanceMap[instance.name]) {
        _instances.push(instance);
        _instanceMap[instance.name] = instance;
      }
    },
    
    // Unregister instance
    unregisterInstance(instance: IOTelClientSdk) {
      if (instance.name) {
        const index = _instances.indexOf(instance);
        if (index !== -1) {
          _instances.splice(index, 1);
          delete _instanceMap[instance.name];
        }
      }
    },
    
    // Shut down all instances
    shutdownAll() {
      return Promise.all(_instances.map(instance => instance.shutdown()));
    },
    
    // Unload all instances
    unloadAll() {
      return Promise.all(_instances.map(instance => instance.unload()));
    },
    
    // Get shared resources
    getSharedResources() {
      return {
        timerPool: _timerPool,
        exportQueue: _exportQueue,
        connectionManager: _connectionManager,
        resourcePool: _resourcePool
      };
    }
  };
  
  return _self;
}
```

### Modified SDK Creation

The `createOTelClientSdk` function is modified to register with the manager:

```typescript
/**
 * Create a new instance of the OpenTelemetry Client SDK
 * @param config - Configuration for the SDK
 * @returns An initialized SDK instance
 */
export function createOTelClientSdk(config: IOTelClientSdkConfig = {}): IOTelClientSdk {
  // Private closure variables
  const _config = config || {};
  const _name = _config.instanceName || generateInstanceName();
  
  // Get the SDK manager - can specify which manager to use
  const _manager = getOTelClientSdkManager(_config.managerName);
  const _sharedResources = _manager.getSharedResources();
  
  // Rest of the implementation...
  
  // Register with the manager
  _manager.registerInstance(_self);
  
  return _self;
}
```

### Instance Identification

Each SDK instance has a unique name and identifier:

```typescript
export interface IOTelClientSdk {
  /** The name of this SDK instance */
  readonly name: string;
  /** The unique identifier for this SDK instance */
  readonly instanceId: string;
  // Rest of interface...
}
```

### Shared Timer Pool

The timer pool minimizes timer creation across instances:

```typescript
export interface ITimerPool {
  /** Schedule a callback to run after a delay */
  setTimeout(callback: () => void, delay: number): number;
  /** Schedule a callback to run repeatedly */
  setInterval(callback: () => void, interval: number): number;
  /** Clear a timeout */
  clearTimeout(timeoutId: number): void;
  /** Clear an interval */
  clearInterval(intervalId: number): void;
}
```

### Shared Export Queue

The export queue batches telemetry from all instances:

```typescript
export interface IExportQueue {
  /** Add telemetry to the export queue */
  addToQueue(telemetry: ITelemetryItem, instanceId: string): void;
  /** Flush the export queue immediately */
  flush(): Promise<void>;
  /** Get the current queue size */
  getQueueSize(): number;
}
```

### Shared Connection Manager

The connection manager coordinates network connections:

```typescript
export interface IConnectionManager {
  /** Get a connection for a specific endpoint */
  getConnection(endpoint: string): IConnection;
  /** Release a connection */
  releaseConnection(connection: IConnection): void;
  /** Close all connections */
  closeAllConnections(): Promise<void>;
}
```

## Version Management

Multiple versions of the SDK can coexist in the same runtime:

1. Different versions can create and manage their own SDK Manager instances
2. Each version maintains its own semantic conventions and implementations
3. Instances from different versions operate independently
4. Multiple SDK Managers allow isolation between different versions or teams
5. Resource usage is optimized within each manager's instances
6. Different versions can use separate managers to avoid conflicts

## Usage Examples

### Basic Multi-Instance Usage

```typescript
import { 
  createOTelClientSdk, 
  getOTelClientSdkManager 
} from '@microsoft/applicationinsights-otelclientsdk';

// Create SDK instances for different teams using the default manager
const teamAInstance = createOTelClientSdk({
  instanceName: 'team-a',
  connectionString: 'InstrumentationKey=team-a-key'
});

const teamBInstance = createOTelClientSdk({
  instanceName: 'team-b',
  connectionString: 'InstrumentationKey=team-b-key'
});

// Initialize both instances
teamAInstance.initialize();
teamBInstance.initialize();

// Each team uses their own instance
const teamATracer = teamAInstance.trace.getTracer('team-a-service');
const teamBTracer = teamBInstance.trace.getTracer('team-b-service');

// Get the SDK Manager to check active instances
const defaultManager = getOTelClientSdkManager();
console.log(`Active instances in default manager: ${defaultManager.getInstanceCount()}`);
```

### Using Multiple Managers

```typescript
import { 
  createOTelClientSdk,
  getOTelClientSdkManager 
} from '@microsoft/applicationinsights-otelclientsdk';

// Create SDK instances for different projects using separate managers
const teamCInstance = createOTelClientSdk({
  instanceName: 'team-c',
  managerName: 'project-alpha',
  connectionString: 'InstrumentationKey=team-c-key'
});

const teamDInstance = createOTelClientSdk({
  instanceName: 'team-d',
  managerName: 'project-beta',
  connectionString: 'InstrumentationKey=team-d-key'
});

// Initialize the instances
teamCInstance.initialize();
teamDInstance.initialize();

// Access each specific manager
const alphaManager = getOTelClientSdkManager('project-alpha');
const betaManager = getOTelClientSdkManager('project-beta');

console.log(`Project Alpha instances: ${alphaManager.getInstanceCount()}`);
console.log(`Project Beta instances: ${betaManager.getInstanceCount()}`);

// Independent control over each manager's resources
alphaManager.getSharedResources().exportQueue.flush();
```

### Advanced Resource Control

```typescript
import { 
  createOTelClientSdk, 
  getOTelClientSdkManager 
} from '@microsoft/applicationinsights-otelclientsdk';

// Create SDK instance with resource control
const instance = createOTelClientSdk({
  instanceName: 'my-instance',
  resourceControls: {
    maxQueueSize: 1000,
    maxConnections: 2,
    timerMinimumInterval: 1000
  }
});

instance.initialize();

// Access shared resources
const manager = getOTelClientSdkManager();
const resources = manager.getSharedResources();

// Flush telemetry from all instances immediately
resources.exportQueue.flush();
```

## Benefits

1. **Resource Efficiency**: Shared resources reduce memory and CPU usage
2. **Isolation**: Teams maintain configuration and processing isolation
3. **Independent Development**: Teams can work independently
4. **Central Management**: Global controls for resource usage
5. **Optimized Network**: Reduced connection count and improved batching

## Conclusion

The OTelClientSdk Manager enables efficient multi-instance support while minimizing the impact on runtime performance. This approach allows different teams or components to use the SDK with their own configurations and control planes, while benefiting from shared underlying resources.
