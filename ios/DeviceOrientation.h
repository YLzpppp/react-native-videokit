//
//  DeviceOrientation.h
//  DeviceOrientation
//
//  Created by lzp on 2020/12/4.
//  Copyright © 2020 Facebook. All rights reserved.
//
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>


@interface DeviceOrientation : RCTEventEmitter <RCTBridgeModule>

+ (void)setOrientation: (UIInterfaceOrientationMask)orientation;
+ (UIInterfaceOrientationMask)getOrientation;
+ (void) emitEvent:(NSDictionary *)payload;

@end
