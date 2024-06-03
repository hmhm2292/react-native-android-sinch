
#ifdef RCT_NEW_ARCH_ENABLED
#import "RNAndroidSinchSpec.h"

@interface AndroidSinch : NSObject <NativeAndroidSinchSpec>
#else
#import <React/RCTBridgeModule.h>

@interface AndroidSinch : NSObject <RCTBridgeModule>
#endif

@end
