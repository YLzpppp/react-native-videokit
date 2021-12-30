//
//  HLSServerManager.m
//  react-native-videokit
//
//  Created by lzp on 2021/6/1.
//

#import "HLSServerManager.h"

@implementation HLSServerManager

static HLSServerManager* _shared = nil;

+(instancetype) shared
{
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        _shared = [[super allocWithZone: NULL] init];
    });
    return _shared;
}
+(id) allocWithZone:(struct _NSZone *)zone
{
    return [HLSServerManager shared] ;
}

-(id) copyWithZone:(struct _NSZone *)zone
{
    return [HLSServerManager shared] ;
}

@end
