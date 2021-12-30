//
//  HLSServerManager.h
//  react-native-videokit
//
//  Created by lzp on 2021/6/1.
//

#import <Foundation/Foundation.h>
#import "GCDWebServer.h"

@interface HLSServerManager : NSObject

+(instancetype) shared;
@property (nonatomic,strong) GCDWebServer* server;

@end
