//
//  HLSServerManager.m
//  VideoCache
//
//  Created by lzp on 2021/5/7.
//

#import "HLSServerModule.h"
#import "HLSServerManager.h"

@implementation HLSServerModule

RCT_EXPORT_MODULE(HLSServerModule);

- (NSArray<NSString *> *)supportedEvents
{
    return @[];
}
RCT_EXPORT_METHOD(startHLSServer: (NSString *)directory onSuccess: (RCTResponseSenderBlock) onSuccess )
{
    dispatch_async(dispatch_get_main_queue(), ^{
        if ([HLSServerManager shared].server == nil) {
            [HLSServerManager shared].server = [[GCDWebServer alloc] init];
        }
        if (![HLSServerManager shared].server.running){
            
            [[HLSServerManager shared].server addGETHandlerForBasePath:@"/" directoryPath:directory indexFilename: nil cacheAge:3600 allowRangeRequests:YES];
            [[HLSServerManager shared].server startWithPort:9876 bonjourName:nil];
            onSuccess(@[@"9876"]);
        }
    });
}

RCT_EXPORT_METHOD(startHLSServerWithPort: (NSString *)directory port:(NSUInteger) port onSuccess: (RCTResponseSenderBlock) onSuccess )
{
    dispatch_async(dispatch_get_main_queue(), ^{
        if ([HLSServerManager shared].server == nil) {
            [HLSServerManager shared].server = [[GCDWebServer alloc] init];
        }
        if (![HLSServerManager shared].server.running){
            [[HLSServerManager shared].server addGETHandlerForBasePath:@"/" directoryPath:directory indexFilename: nil cacheAge:3600 allowRangeRequests:YES];
            [[HLSServerManager shared].server startWithPort:port bonjourName:nil];
            onSuccess(@[ [NSString stringWithFormat:@"%lu",(unsigned long)port] ]);
        }
    });
}

@end
